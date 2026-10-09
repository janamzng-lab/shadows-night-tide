import * as THREE from 'three';
import { 
  PlayerState, 
  WeaponId, 
  EnemyInstance, 
  InteractiveDoor, 
  LevelItem, 
  GameSettings 
} from './types';
import { INITIAL_WEAPONS } from './weapons';
import { buildChapter1Level, LevelData } from './level';
import { 
  buildMaryamBossMesh, 
  buildSarahBossMesh, 
  buildFollowerMesh, 
  buildWeaponViewModel,
  EnemyMeshRig 
} from './models';
import { navSystem, updateEnemyAI } from './pathfinding';
import { horrorAudio } from './audio';
import { NightTidePostProcessor } from './postprocessing';

export interface GameEngineCallbacks {
  onPlayerUpdate: (state: PlayerState) => void;
  onBossUpdate: (boss: { name: string; health: number; maxHealth: number } | null) => void;
  onPromptUpdate: (prompt: string | null) => void;
  onGameOver: () => void;
  onVictory: () => void;
  onOpenShop: () => void;
  onDamageFlash: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Level & World
  private levelData: LevelData;
  private enemyRigs = new Map<string, EnemyMeshRig>();
  private activeDoors = new Map<string, THREE.Group>();
  private itemMeshes = new Map<string, THREE.Group>();

  // Flashlight & Camera
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private flashlightConeMesh: THREE.Mesh | null = null;
  private ambientLight: THREE.AmbientLight;

  // Viewmodels & Active Special Weapon Visuals
  private weaponRigGroup: THREE.Group;
  private currentWeaponMesh: THREE.Group | null = null;
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashTimer: number = 0;
  private weaponBobTime: number = 0;
  private recoilOffset: THREE.Vector3 = new THREE.Vector3();
  private laserBeamMesh: THREE.Mesh | null = null;
  private laserImpactLight!: THREE.PointLight;
  private laserTimer: number = 0;
  private electricArcSegments: THREE.LineSegments | null = null;
  private electricArcPositions!: Float32Array;
  private electricArcTimer: number = 0;
  private shockwaveMesh: THREE.Mesh | null = null;
  private shockwaveTimer: number = 0;

  // Dynamic Secondary Roaming Spawner
  private roamingSpawnTimer: number = 0;
  private nextRoamingId: number = 100;
  private hudUpdateTimer: number = 0;

  // Player state & physics
  public player: PlayerState;
  public playerPos: THREE.Vector3 = new THREE.Vector3(-14, 1.7, -12);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public cameraYaw: number = 0;
  public cameraPitch: number = 0;
  private isAiming: boolean = false;
  private isFiring: boolean = false;
  private lastFireTime: number = 0;
  private isReloading: boolean = false;
  private reloadTimer: number = 0;

  // Controls input states
  public moveForward: boolean = false;
  public moveBackward: boolean = false;
  public moveLeft: boolean = false;
  public moveRight: boolean = false;
  public virtualJoystickMove: { x: number; y: number } = { x: 0, y: 0 };

  // Settings & Callbacks
  private callbacks: GameEngineCallbacks;
  public settings: GameSettings;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;

  // Particles & VFX
  private bloodParticles!: THREE.Points;
  private bloodParticlePositions!: Float32Array;
  private bloodParticleVelocities!: Float32Array;

  // Custom Night Tide Horror Shader Pass (Film Grain & Chromatic Aberration)
  private postProcessor!: NightTidePostProcessor;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks, initialSettings: GameSettings) {
    this.container = container;
    this.callbacks = callbacks;
    this.settings = initialSettings;

    // Load saved coins & progress from localStorage if available
    // Storage can be unavailable or contain malformed data (private mode / old builds).
    // Never let persistence failures prevent the game from booting.
    const safeStorageRead = (key: string, fallback: string) => {
      try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    };
    const parsedCoins = Number.parseInt(safeStorageRead('night_tide_coins', '100'), 10);
    const savedCoins = Number.isFinite(parsedCoins) ? Math.max(0, parsedCoins) : 100;
    let savedUnlockedWeapons: string[] = ['pistol', 'shotgun'];
    try {
      const parsed = JSON.parse(safeStorageRead('night_tide_unlocked', '["pistol","shotgun"]'));
      if (Array.isArray(parsed)) savedUnlockedWeapons = parsed.filter((id): id is string => typeof id === 'string');
    } catch { /* use safe defaults */ }

    const initialWeapons = JSON.parse(JSON.stringify(INITIAL_WEAPONS)) as Record<WeaponId, typeof INITIAL_WEAPONS[WeaponId]>;
    savedUnlockedWeapons.forEach((id) => {
      if (initialWeapons[id as WeaponId]) {
        initialWeapons[id as WeaponId].isUnlocked = true;
      }
    });

    this.player = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      battery: 100,
      maxBattery: 100,
      fear: 0,
      maxFear: 100,
      fearCause: 'none',
      flashlightOn: true,
      coins: savedCoins,
      weapons: initialWeapons,
      currentWeaponId: 'pistol',
      inventory: {
        keycards: [],
        medkits: 1,
      },
      objective: 'Search Sector 4 Lab. Find Blue Security Keycard to proceed.',
      objectiveAr: 'ابحث في مختبر القطاع 4. اعثر على بطاقة الأمان الزرقاء للتقدم.',
      isSprinting: false,
      isCrouching: false,
      isGrounded: true,
    };

    // Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030406);
    this.scene.fog = new THREE.FogExp2(0x030508, 0.05);

    const initialWidth = Math.max(1, container.clientWidth || window.innerWidth);
    const initialHeight = Math.max(1, container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 100);
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: this.settings.graphicsQuality === 'high', 
      powerPreference: 'high-performance',
      precision: 'mediump'
    });
    const pixelRatio = this.getPixelRatio();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(initialWidth, initialHeight, false);
    this.renderer.shadowMap.enabled = this.settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.userSelect = 'none';
    container.appendChild(this.renderer.domElement);

    // Initialize custom Horror Post-Processing Shader Pass (Film Grain & Chromatic Aberration)
    this.postProcessor = new NightTidePostProcessor(
      this.renderer,
      initialWidth,
      initialHeight,
      pixelRatio,
      {
        enabled: this.settings.filmGrainEnabled !== false,
      }
    );
    this.postProcessor.setQuality(this.settings.graphicsQuality);

    this.clock = new THREE.Clock();

    // Flashlight & Lighting
    this.ambientLight = new THREE.AmbientLight(0x181c20, 0.45);
    this.scene.add(this.ambientLight);

    this.flashlight = new THREE.SpotLight(0xfff8e8, 3.2, 32, Math.PI / 5.5, 0.45, 1.2);
    this.flashlight.castShadow = this.settings.graphicsQuality !== 'low';
    this.flashlight.shadow.mapSize.width = this.settings.graphicsQuality === 'high' ? 1024 : 512;
    this.flashlight.shadow.mapSize.height = this.settings.graphicsQuality === 'high' ? 1024 : 512;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Volumetric Physical Flashlight Cone attached to camera
    const coneGeom = new THREE.ConeGeometry(2.2, 18, 16, 1, true);
    coneGeom.rotateX(-Math.PI / 2);
    coneGeom.translate(0, 0, -9);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff0dd,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.flashlightConeMesh = new THREE.Mesh(coneGeom, coneMat);
    this.camera.add(this.flashlightConeMesh);

    // Muzzle Flash Light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.scene.add(this.muzzleFlashLight);

    // Laser Beam VFX Mesh
    const laserGeom = new THREE.CylinderGeometry(0.025, 0.025, 1, 8);
    laserGeom.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.laserBeamMesh = new THREE.Mesh(laserGeom, laserMat);
    this.laserBeamMesh.visible = false;
    this.scene.add(this.laserBeamMesh);

    this.laserImpactLight = new THREE.PointLight(0x38bdf8, 0, 6);
    this.scene.add(this.laserImpactLight);

    // Electric Arc Line Segments (branching chain lightning)
    const maxArcSegments = 48;
    this.electricArcPositions = new Float32Array(maxArcSegments * 6);
    const arcGeom = new THREE.BufferGeometry();
    arcGeom.setAttribute('position', new THREE.BufferAttribute(this.electricArcPositions, 3));
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.electricArcSegments = new THREE.LineSegments(arcGeom, arcMat);
    this.electricArcSegments.visible = false;
    this.scene.add(this.electricArcSegments);

    // Expanding 360-degree pulse for the radial EMP weapon.
    this.shockwaveMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.42,
        wireframe: true,
        depthWrite: false,
      })
    );
    this.shockwaveMesh.visible = false;
    this.scene.add(this.shockwaveMesh);

    // Weapon Viewmodel Rig
    this.weaponRigGroup = new THREE.Group();
    this.camera.add(this.weaponRigGroup);
    this.scene.add(this.camera);

    // Build Chapter 1 Map & Nav Obstacles
    this.levelData = buildChapter1Level();
    this.scene.add(this.levelData.walls);
    this.scene.add(this.levelData.floors);
    this.scene.add(this.levelData.lights);
    navSystem.setObstacles(this.levelData.obstacles);

    this.playerPos.set(this.levelData.playerSpawn.x, this.levelData.playerSpawn.y, this.levelData.playerSpawn.z);
    this.camera.position.copy(this.playerPos);

    // Create Doors, Items, and Enemy Rigs
    this.createDoors();
    this.createItemPickups();
    this.createEnemyMeshes();
    this.createBloodParticles();
    this.updateWeaponViewModel();

    // Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = Math.max(1, this.container.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const pixelRatio = this.getPixelRatio();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    if (this.postProcessor) {
      this.postProcessor.setSize(width, height, pixelRatio);
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isPaused) return;
    horrorAudio.resume();
    switch (e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.player.isSprinting = true;
        break;
      case 'KeyC':
        this.player.isCrouching = !this.player.isCrouching;
        break;
      case 'Space':
        if (this.player.isGrounded) {
          this.playerVelocity.y = 5.0;
          this.player.isGrounded = false;
        }
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyR':
        this.reloadWeapon();
        break;
      case 'KeyE':
        this.interactWithWorld();
        break;
      case 'Digit1': this.switchWeapon('pistol'); break;
      case 'Digit2': this.switchWeapon('shotgun'); break;
      case 'Digit3': this.switchWeapon('rifle'); break;
      case 'Digit4': this.switchWeapon('heavy'); break;
      case 'Digit5': this.switchWeapon('laser'); break;
      case 'Digit6': this.switchWeapon('electric'); break;
      case 'Digit7': this.switchWeapon('taser'); break;
      case 'Digit8': this.switchWeapon('shock'); break;
      case 'Digit9': this.switchWeapon('energy'); break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.player.isSprinting = false;
        break;
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    if (this.isPaused) return;
    if (e.button === 0) {
      this.isFiring = true;
    } else if (e.button === 2) {
      this.isAiming = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isFiring = false;
    } else if (e.button === 2) {
      this.isAiming = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPaused && document.pointerLockElement === this.renderer.domElement) {
      const sens = 0.0022 * (this.settings.sensitivity / 50);
      this.rotateCamera(-e.movementX * sens, -e.movementY * sens);
    }
  };

  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    this.cameraYaw += deltaYaw;
    this.cameraPitch += deltaPitch;
    this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.cameraYaw;
    this.camera.rotation.x = this.cameraPitch;
  }

  public requestPointerLock() {
    horrorAudio.init();
    horrorAudio.resume();
    this.renderer.domElement.requestPointerLock();
  }

  // ---------------- OBJECT & MESH BUILDERS ----------------
  private createDoors() {
    this.levelData.interactiveDoors.forEach((door) => {
      const group = new THREE.Group();
      group.position.set(door.position.x, door.position.y, door.position.z);
      group.rotation.y = door.rotation;

      // Sliding / Swinging door panel
      const panelGeom = new THREE.BoxGeometry(2.4, 3.2, 0.2);
      const panelMat = new THREE.MeshStandardMaterial({
        color: door.isLocked ? 0x7f1d1d : 0x334155,
        roughness: 0.4,
        metalness: 0.8,
      });
      const panelMesh = new THREE.Mesh(panelGeom, panelMat);
      panelMesh.position.y = 1.6;
      group.add(panelMesh);

      // Electronic card scanner light
      const scanLight = new THREE.PointLight(door.isLocked ? 0xef4444 : 0x22c55e, 0.8, 3.0);
      scanLight.position.set(1.1, 1.4, 0.15);
      group.add(scanLight);

      this.scene.add(group);
      this.activeDoors.set(door.id, group);
    });
  }

  private createItemPickups() {
    this.levelData.items.forEach((item) => {
      const group = new THREE.Group();
      group.position.set(item.position.x, item.position.y, item.position.z);

      let mesh: THREE.Mesh;
      if (item.type === 'coin') {
        // Glowing gold Night Coin
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 })
        );
        mesh.rotation.x = Math.PI / 2;
        const glow = new THREE.PointLight(0xf59e0b, 0.6, 2.5);
        group.add(glow);
      } else if (item.type === 'keycard') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.04, 0.45),
          new THREE.MeshStandardMaterial({
            color: item.keyId === 'lab_key' ? 0x38bdf8 : 0xef4444,
            roughness: 0.3,
            metalness: 0.7,
          })
        );
        const glow = new THREE.PointLight(item.keyId === 'lab_key' ? 0x38bdf8 : 0xef4444, 0.8, 3.0);
        group.add(glow);
      } else if (item.type === 'medkit') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.3, 0.25),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
        );
      } else {
        // Ammo box
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.25, 0.25),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.6 })
        );
      }

      mesh.castShadow = true;
      group.add(mesh);
      this.scene.add(group);
      this.itemMeshes.set(item.id, group);
    });
  }

  private createEnemyMeshes() {
    this.levelData.enemies.forEach((enemy) => {
      let rig: EnemyMeshRig;
      if (enemy.type === 'boss_maryam') {
        rig = buildMaryamBossMesh();
      } else if (enemy.type === 'boss_sarah') {
        rig = buildSarahBossMesh();
      } else {
        rig = buildFollowerMesh(enemy.type);
      }

      rig.root.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
      rig.root.rotation.y = enemy.rotation;
      this.scene.add(rig.root);
      this.enemyRigs.set(enemy.id, rig);
    });
  }

  private createBloodParticles() {
    const count = 300;
    this.bloodParticlePositions = new Float32Array(count * 3);
    this.bloodParticleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.bloodParticlePositions[i * 3 + 1] = -100; // start hidden underground
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.bloodParticlePositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x990000,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
    });
    this.bloodParticles = new THREE.Points(geom, mat);
    this.scene.add(this.bloodParticles);
  }

  public spawnBloodSplatter(x: number, y: number, z: number) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * (this.bloodParticlePositions.length / 3));
      this.bloodParticlePositions[idx * 3] = x;
      this.bloodParticlePositions[idx * 3 + 1] = y;
      this.bloodParticlePositions[idx * 3 + 2] = z;

      this.bloodParticleVelocities[idx * 3] = (Math.random() - 0.5) * 4.0;
      this.bloodParticleVelocities[idx * 3 + 1] = Math.random() * 3.5;
      this.bloodParticleVelocities[idx * 3 + 2] = (Math.random() - 0.5) * 4.0;
    }
    this.bloodParticles.geometry.attributes.position.needsUpdate = true;
  }

  // ---------------- WEAPONS & VIEWMODEL ----------------
  public updateWeaponViewModel() {
    if (this.currentWeaponMesh) {
      this.weaponRigGroup.remove(this.currentWeaponMesh);
    }
    this.currentWeaponMesh = buildWeaponViewModel(this.player.currentWeaponId);
    this.weaponRigGroup.add(this.currentWeaponMesh);
  }

  public switchWeapon(id: WeaponId) {
    if (this.player.weapons[id] && this.player.weapons[id].isUnlocked && id !== this.player.currentWeaponId) {
      this.isReloading = false;
      this.reloadTimer = 0;
      this.player.currentWeaponId = id;
      this.updateWeaponViewModel();
      horrorAudio.playMechanicalClick(0.1, 700);
      this.callbacks.onPlayerUpdate({ ...this.player });
    }
  }

  public cycleNextWeapon() {
    const available = Object.keys(this.player.weapons).filter(
      (k) => this.player.weapons[k as WeaponId].isUnlocked
    ) as WeaponId[];
    const currIdx = available.indexOf(this.player.currentWeaponId);
    const nextIdx = (currIdx + 1) % available.length;
    this.switchWeapon(available[nextIdx]);
  }

  public triggerFire(isFiring: boolean) {
    this.isFiring = isFiring;
  }

  public triggerAim(isAiming: boolean) {
    this.isAiming = isAiming;
  }

  public reloadWeapon() {
    const weapon = this.player.weapons[this.player.currentWeaponId];
    if (weapon.currentClip < weapon.clipSize && weapon.reserveAmmo > 0 && !this.isReloading) {
      this.isReloading = true;
      this.reloadTimer = weapon.reloadTime;
      horrorAudio.playReload();
    }
  }

  public toggleFlashlight() {
    this.player.flashlightOn = !this.player.flashlightOn;
    horrorAudio.playFlashlightClick();
    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  // ---------------- INTERACTION ----------------
  public interactWithWorld() {
    // Check doors
    for (const door of this.levelData.interactiveDoors) {
      const dist = Math.hypot(door.position.x - this.playerPos.x, door.position.z - this.playerPos.z);
      if (dist < 3.2) {
        if (door.isLocked) {
          if (door.requiredKey && this.player.inventory.keycards.includes(door.requiredKey)) {
            // Unlock door with keycard!
            door.isLocked = false;
            door.isOpen = true;
            horrorAudio.playDoorOpen();
            this.callbacks.onPromptUpdate(`Unlocked ${door.name}!`);
          } else {
            horrorAudio.playEmptyClick();
            this.callbacks.onPromptUpdate(`Locked! Requires ${door.requiredKey === 'lab_key' ? 'Blue Lab Keycard' : 'Red Quarantine Keycard'}.`);
          }
        } else {
          door.isOpen = !door.isOpen;
          horrorAudio.playDoorOpen();
        }
        return;
      }
    }

    // Check Safe Room Terminal / Shop
    const distToShop = Math.hypot(-12 - this.playerPos.x, -16 - this.playerPos.z);
    if (distToShop < 3.0) {
      this.callbacks.onOpenShop();
      return;
    }
  }

  // ---------------- SPECIAL WEAPON & ARC HELPERS ----------------
  private generateLightningArc(start: THREE.Vector3, end: THREE.Vector3, startSegmentIndex: number, steps: number = 8) {
    if (!this.electricArcPositions || !this.electricArcSegments) return;
    const delta = end.clone().sub(start);
    let prevPoint = start.clone();

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const pt = start.clone().add(delta.clone().multiplyScalar(t));
      if (i < steps) {
        pt.x += (Math.random() - 0.5) * 0.35;
        pt.y += (Math.random() - 0.5) * 0.35;
        pt.z += (Math.random() - 0.5) * 0.35;
      }

      const pIdx = (startSegmentIndex + (i - 1)) * 6;
      if (pIdx + 5 < this.electricArcPositions.length) {
        this.electricArcPositions[pIdx] = prevPoint.x;
        this.electricArcPositions[pIdx + 1] = prevPoint.y;
        this.electricArcPositions[pIdx + 2] = prevPoint.z;
        this.electricArcPositions[pIdx + 3] = pt.x;
        this.electricArcPositions[pIdx + 4] = pt.y;
        this.electricArcPositions[pIdx + 5] = pt.z;
      }
      prevPoint = pt;
    }
    this.electricArcSegments.geometry.attributes.position.needsUpdate = true;
  }

  public spawnRoamingMonster() {
    const activeMinors = this.levelData.enemies.filter((e) => !e.isBoss && e.health > 0);
    if (activeMinors.length >= 6) return; // Keep mobile performance optimal

    const spawnPoints = [
      { x: -18, z: 22 },
      { x: 26, z: -20 },
      { x: 22, z: 22 },
      { x: -14, z: 2 },
    ];
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    const types: ('follower_crawler' | 'follower_shambler' | 'follower_stalker')[] = [
      'follower_crawler',
      'follower_shambler',
      'follower_stalker',
    ];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const id = `roaming_${chosenType}_${this.nextRoamingId++}`;
    const nameMap = {
      follower_crawler: { en: 'Roaming Crawler', ar: 'زاحف متجول' },
      follower_shambler: { en: 'Roaming Shambler', ar: 'مترنح متجول' },
      follower_stalker: { en: 'Roaming Shore Stalker', ar: 'صائد شاطئي متجول' },
    };

    const newEnemy: EnemyInstance = {
      id,
      type: chosenType,
      name: nameMap[chosenType].en,
      nameAr: nameMap[chosenType].ar,
      health: chosenType === 'follower_shambler' ? 110 : chosenType === 'follower_stalker' ? 90 : 70,
      maxHealth: chosenType === 'follower_shambler' ? 110 : chosenType === 'follower_stalker' ? 90 : 70,
      speed: chosenType === 'follower_crawler' ? 2.3 : chosenType === 'follower_stalker' ? 2.5 : 1.8,
      runSpeed: chosenType === 'follower_crawler' ? 4.7 : chosenType === 'follower_stalker' ? 4.9 : 3.8,
      damage: chosenType === 'follower_shambler' ? 22 : 16,
      attackRange: chosenType === 'follower_crawler' ? 1.4 : 1.8,
      attackCooldown: 1.2,
      lastAttackTime: 0,
      aiState: 'INVESTIGATE',
      position: { x: spawn.x, y: 0, z: spawn.z },
      rotation: 0,
      velocity: { x: 0, y: 0, z: 0 },
      targetPosition: null,
      lastKnownPlayerPos: { ...this.playerPos },
      patrolWaypoints: [
        { x: spawn.x, z: spawn.z },
        { x: this.playerPos.x, z: this.playerPos.z },
      ],
      currentWaypointIndex: 1,
      searchTimer: 8.0,
      stunTimer: 0,
      isBoss: false,
      bossPhase: 1,
      detectionRange: 16,
      hearingRange: 15,
      hitReactionTimer: 0,
      dropCoins: 50,
    };

    this.levelData.enemies.push(newEnemy);
    const rig = buildFollowerMesh(chosenType);
    rig.root.position.set(spawn.x, 0, spawn.z);
    this.scene.add(rig.root);
    this.enemyRigs.set(id, rig);

    horrorAudio.playFollowerSnarl();
  }

  private persistCoins() {
    try {
      window.localStorage.setItem('night_tide_coins', this.player.coins.toString());
    } catch {
      // Storage can be disabled or full; gameplay should continue.
    }
  }

  private getPixelRatio() {
    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const quality = this.settings.graphicsQuality;
    const maxPixelRatio = isMobile
      ? (quality === 'high' ? 1.15 : quality === 'medium' ? 0.9 : 0.7)
      : (quality === 'high' ? 1.5 : quality === 'medium' ? 1.0 : 0.75);
    return Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  }

  private persistUnlockedWeapons() {
    try {
      const unlocked = Object.keys(this.player.weapons)
        .filter((id) => this.player.weapons[id as WeaponId].isUnlocked);
      window.localStorage.setItem('night_tide_unlocked', JSON.stringify(unlocked));
    } catch {
      // Storage can be disabled or full; gameplay should continue.
    }
  }

  private applyEnemyDamage(enemy: EnemyInstance, damage: number) {
    if (enemy.health <= 0 || damage <= 0) return;

    enemy.health = Math.max(0, enemy.health - damage);
    enemy.hitReactionTimer = 0.2;
    horrorAudio.playMonsterHit();
    this.spawnBloodSplatter(enemy.position.x, 1.4, enemy.position.z);

    if (enemy.health === 0) {
      horrorAudio.playMonsterDeath();
      this.player.coins += enemy.dropCoins;
      this.persistCoins();
      this.callbacks.onPromptUpdate(`+${enemy.dropCoins} NIGHT COINS`);
      this.callbacks.onPlayerUpdate({ ...this.player });

      if (enemy.isBoss) {
        horrorAudio.setChaseMusic(false);
        if (enemy.type === 'boss_maryam') {
          this.callbacks.onVictory();
        }
      }
    }
  }

  // ---------------- COMBAT RESOLUTION ----------------
  private fireCurrentWeapon() {
    const weapon = this.player.weapons[this.player.currentWeaponId];
    if (this.isReloading) return;

    if (weapon.currentClip <= 0) {
      horrorAudio.playEmptyClick();
      this.reloadWeapon();
      return;
    }

    weapon.currentClip--;
    horrorAudio.playWeaponFire(weapon.id);

    // Muzzle flash light & recoil kick
    this.muzzleFlashLight.intensity = 3.5;
    this.muzzleFlashTimer = 0.06;
    this.recoilOffset.z = 0.08;
    this.recoilOffset.y = 0.03;

    // Hitscan attacks originate at the camera.
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);

    // Approximate weapon muzzle position in world space
    const muzzlePos = this.camera.position.clone()
      .add(cameraDir.clone().multiplyScalar(0.45))
      .add(new THREE.Vector3(0.18, -0.16, 0).applyEuler(new THREE.Euler(0, this.cameraYaw, 0)));

    let hitEnemyForVFX: EnemyInstance | null = null;
    let hitPointForVFX: THREE.Vector3 | null = null;
    const damageMultiplier = 1.0 + weapon.upgradeTier * 0.25;
    const finalDamage = Math.round(weapon.damage * damageMultiplier);

    if (weapon.id === 'shock') {
      // The EMP is a radial pulse, not a forward-facing hitscan shot.
      const targets = this.levelData.enemies.filter((enemy) => {
        if (enemy.health <= 0 || !this.enemyRigs.has(enemy.id)) return false;
        const distance = Math.hypot(enemy.position.x - this.playerPos.x, enemy.position.z - this.playerPos.z);
        return distance <= weapon.range &&
          navSystem.hasLineOfSight(this.playerPos.x, this.playerPos.z, enemy.position.x, enemy.position.z);
      });

      for (const enemy of targets) {
        if (!hitEnemyForVFX) {
          hitEnemyForVFX = enemy;
          hitPointForVFX = new THREE.Vector3(enemy.position.x, 1.25, enemy.position.z);
        }

        this.applyEnemyDamage(enemy, finalDamage);
        if (enemy.health > 0) {
          enemy.lastKnownPlayerPos = { ...this.playerPos };
          if (!enemy.isBoss) {
            enemy.stunTimer = Math.max(enemy.stunTimer, 4.5);
            enemy.aiState = 'STUNNED';
          }

          // Push nearby enemies away from the pulse while respecting walls.
          const dx = enemy.position.x - this.playerPos.x;
          const dz = enemy.position.z - this.playerPos.z;
          const distance = Math.hypot(dx, dz) || 1;
          const pushDistance = 1.5 * (1 - distance / weapon.range);
          const nextX = enemy.position.x + (dx / distance) * pushDistance;
          const nextZ = enemy.position.z + (dz / distance) * pushDistance;
          if (navSystem.isWalkable(nextX, enemy.position.z)) enemy.position.x = nextX;
          if (navSystem.isWalkable(enemy.position.x, nextZ)) enemy.position.z = nextZ;
        }
      }

      if (this.shockwaveMesh) {
        this.shockwaveMesh.position.set(this.playerPos.x, 1, this.playerPos.z);
        this.shockwaveMesh.scale.setScalar(0.25);
        (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.42;
        this.shockwaveMesh.visible = true;
        this.shockwaveTimer = 0.45;
      }
    } else {
      const pellets = weapon.pellets || 1;
      for (let p = 0; p < pellets; p++) {
        const spreadX = (Math.random() - 0.5) * weapon.spread;
        const spreadY = (Math.random() - 0.5) * weapon.spread;
        const shotDir = cameraDir.clone().add(new THREE.Vector3(spreadX, spreadY, 0)).normalize();

        let closestHitDist = weapon.range;
        let hitEnemy: EnemyInstance | null = null;

        for (const enemy of this.levelData.enemies) {
          if (enemy.health <= 0 || !this.enemyRigs.has(enemy.id)) continue;

          const enemyCenter = new THREE.Vector3(enemy.position.x, enemy.position.y + 1.2, enemy.position.z);
          const toEnemy = enemyCenter.sub(this.camera.position);
          const alongRay = toEnemy.dot(shotDir);
          if (alongRay <= 0 || alongRay > closestHitDist) continue;

          const perpendicularSq = Math.max(0, toEnemy.lengthSq() - alongRay * alongRay);
          if (perpendicularSq <= 0.75 * 0.75) {
            closestHitDist = alongRay;
            hitEnemy = enemy;
          }
        }

        if (!hitEnemy) continue;

        hitEnemyForVFX = hitEnemy;
        hitPointForVFX = new THREE.Vector3(hitEnemy.position.x, 1.25, hitEnemy.position.z);
        this.applyEnemyDamage(hitEnemy, finalDamage);

        if (hitEnemy.health > 0) {
          const stunDuration = weapon.id === 'taser' ? 3.5 : weapon.id === 'electric' ? 2.0 : 0;
          if (stunDuration > 0 && !hitEnemy.isBoss) {
            hitEnemy.stunTimer = Math.max(hitEnemy.stunTimer, stunDuration);
            hitEnemy.aiState = 'STUNNED';
          } else {
            hitEnemy.aiState = 'CHASE';
          }
          hitEnemy.lastKnownPlayerPos = { ...this.playerPos };
        }
      }
    }

    const targetHitPoint = hitPointForVFX || this.camera.position.clone().add(cameraDir.clone().multiplyScalar(weapon.range));

    // Active Visual Mechanics: Laser Gun (Prism Arc)
    if (weapon.id === 'laser' && this.laserBeamMesh) {
      const beamVec = targetHitPoint.clone().sub(muzzlePos);
      const beamLen = beamVec.length();
      const beamCenter = muzzlePos.clone().add(beamVec.clone().multiplyScalar(0.5));

      this.laserBeamMesh.position.copy(beamCenter);
      this.laserBeamMesh.scale.set(1, 1, beamLen);
      this.laserBeamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamVec.normalize());
      this.laserBeamMesh.visible = true;

      this.laserImpactLight.position.copy(targetHitPoint);
      this.laserImpactLight.intensity = 3.5;
      this.laserTimer = 0.12;
    }

    // Active Visual Mechanics: Taser (Twin Electrical Arcs)
    if (weapon.id === 'taser') {
      this.generateLightningArc(muzzlePos, targetHitPoint, 0, 10);
      this.generateLightningArc(muzzlePos.clone().add(new THREE.Vector3(0.04, 0, 0)), targetHitPoint, 10, 10);
      if (this.electricArcSegments) this.electricArcSegments.visible = true;
      this.electricArcTimer = 0.2;
    }

    // Active Visual Mechanics: Electric Gun (Tesla Arc Branching Chain Lightning)
    if (weapon.id === 'electric') {
      this.generateLightningArc(muzzlePos, targetHitPoint, 0, 12);

      if (hitEnemyForVFX) {
        let chainCount = 0;
        for (const other of this.levelData.enemies) {
          if (other === hitEnemyForVFX || other.health <= 0) continue;
          const chainDist = Math.hypot(other.position.x - hitEnemyForVFX.position.x, other.position.z - hitEnemyForVFX.position.z);
          if (chainDist < 6.5 && chainCount < 2) {
            const secondaryPt = new THREE.Vector3(other.position.x, 1.2, other.position.z);
            this.generateLightningArc(targetHitPoint, secondaryPt, 12 + chainCount * 12, 10);
            this.applyEnemyDamage(other, Math.round(weapon.damage * 0.7));
            if (other.health > 0) {
              if (!other.isBoss) {
                other.stunTimer = Math.max(other.stunTimer, 2.0);
                other.aiState = 'STUNNED';
              } else {
                other.aiState = 'CHASE';
              }
              other.lastKnownPlayerPos = { ...this.playerPos };
            }
            chainCount++;
          }
        }
      }

      if (this.electricArcSegments) this.electricArcSegments.visible = true;
      this.electricArcTimer = 0.25;
    }

    // Acoustic trigger for dynamic secondary roaming monsters
    if (weapon.category === 'conventional' && weapon.id !== 'pistol' && Math.random() < 0.25) {
      this.spawnRoamingMonster();
    }

    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  // ---------------- MAIN GAME LOOP ----------------
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    horrorAudio.stopAll();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
      this.virtualJoystickMove = { x: 0, y: 0 };
      this.player.isSprinting = false;
      this.isFiring = false;
      this.isAiming = false;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) {
      // Keep the canvas responsive without advancing game time under menus.
      this.clock.getDelta();
      this.render();
      return;
    }

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.update(deltaTime);
    this.render();
  };

  private update(dt: number) {
    // 1. Player movement physics
    let moveX = 0;
    let moveZ = 0;

    if (this.moveForward) moveZ -= 1;
    if (this.moveBackward) moveZ += 1;
    if (this.moveLeft) moveX -= 1;
    if (this.moveRight) moveX += 1;

    // Mobile Virtual Joystick overlay
    if (Math.hypot(this.virtualJoystickMove.x, this.virtualJoystickMove.y) > 0.05) {
      moveX = this.virtualJoystickMove.x;
      moveZ = this.virtualJoystickMove.y;
    }

    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 0.01) {
      moveX /= Math.max(1.0, inputLen);
      moveZ /= Math.max(1.0, inputLen);
    }

    // Stamina & Sprinting
    let baseSpeed = 4.0;
    if (this.player.isCrouching) {
      baseSpeed = 2.0;
    } else if (this.player.isSprinting && this.player.stamina > 5) {
      baseSpeed = 7.0;
      this.player.stamina = Math.max(0, this.player.stamina - dt * 25);
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + dt * 15);
    }

    // Footstep audio
    if (inputLen > 0.1 && this.player.isGrounded) {
      this.weaponBobTime += dt * (baseSpeed > 5 ? 14 : 9);
      if (Math.sin(this.weaponBobTime) < -0.95) {
        horrorAudio.playFootstep(this.player.isSprinting, this.player.isCrouching);
      }
    }

    // Relative movement vectors based on camera yaw
    const forwardVec = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const rightVec = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

    const targetVelX = (rightVec.x * moveX + forwardVec.x * -moveZ) * baseSpeed;
    const targetVelZ = (rightVec.z * moveX + forwardVec.z * -moveZ) * baseSpeed;

    this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, targetVelX, 0.2);
    this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, targetVelZ, 0.2);

    // Gravity
    if (!this.player.isGrounded) {
      this.playerVelocity.y -= 14.0 * dt;
    }

    // Move player with wall sliding collision
    const nextX = this.playerPos.x + this.playerVelocity.x * dt;
    const nextZ = this.playerPos.z + this.playerVelocity.z * dt;
    const nextY = this.playerPos.y + this.playerVelocity.y * dt;

    if (navSystem.isWalkable(nextX, this.playerPos.z)) {
      this.playerPos.x = nextX;
    } else {
      this.playerVelocity.x = 0;
    }

    if (navSystem.isWalkable(this.playerPos.x, nextZ)) {
      this.playerPos.z = nextZ;
    } else {
      this.playerVelocity.z = 0;
    }

    if (nextY <= (this.player.isCrouching ? 1.0 : 1.7)) {
      this.playerPos.y = this.player.isCrouching ? 1.0 : 1.7;
      this.playerVelocity.y = 0;
      this.player.isGrounded = true;
    } else {
      this.playerPos.y = nextY;
    }

    this.camera.position.copy(this.playerPos);

    // Dynamic Secondary Roaming Spawner ticker
    this.roamingSpawnTimer += dt;
    if (this.roamingSpawnTimer >= 28.0) {
      this.roamingSpawnTimer = 0;
      this.spawnRoamingMonster();
    }

    // Flashlight battery & flicker
    if (this.player.flashlightOn) {
      this.player.battery = Math.max(0, this.player.battery - dt * 0.4);
      if (this.player.battery <= 0) {
        this.player.flashlightOn = false;
      }
    }

    // Proximity to ceiling lights (detect dark unlit areas)
    let closestCeilingLightDist = 999;
    for (const light of this.levelData.lights.children) {
      if (light instanceof THREE.PointLight) {
        const d = Math.hypot(light.position.x - this.playerPos.x, light.position.z - this.playerPos.z);
        if (d < closestCeilingLightDist) {
          closestCeilingLightDist = d;
        }
      }
    }

    // Check proximity to monsters & bosses to trigger fear, audio and Boss Health Bar
    let nearestMonsterDist = 999;
    let nearestIsBoss = false;
    let nearestIsAggressive = false;
    let activeBoss: { name: string; health: number; maxHealth: number } | null = null;

    for (const enemy of this.levelData.enemies) {
      if (enemy.health <= 0) continue;
      const dist = Math.hypot(enemy.position.x - this.playerPos.x, enemy.position.z - this.playerPos.z);
      if (dist < nearestMonsterDist) {
        nearestMonsterDist = dist;
        nearestIsBoss = enemy.isBoss;
        nearestIsAggressive = enemy.aiState === 'CHASE' || enemy.aiState === 'ATTACK';
      }

      if (enemy.isBoss && (enemy.aiState === 'CHASE' || enemy.aiState === 'ATTACK' || enemy.hitReactionTimer > 0 || dist < 16)) {
        activeBoss = { name: enemy.name, health: enemy.health, maxHealth: enemy.maxHealth };
      }
    }

    this.callbacks.onBossUpdate(activeBoss);

    // ================= FEAR METER DYNAMICS =================
    // Increases in dark areas or near monsters; decreases in well-lit safety
    let fearRate = 0; // units per second
    let fearCause: 'darkness' | 'monster' | 'critical' | 'none' = 'none';

    // 1. Dark Areas Calculation:
    if (!this.player.flashlightOn) {
      // Flashlight is OFF: terrifying facility gloom
      if (closestCeilingLightDist > 8.0) {
        fearRate += 16.0;
        fearCause = 'darkness';
      } else {
        fearRate += 6.0;
        fearCause = 'darkness';
      }
    } else {
      // Flashlight is ON, but isolated deep in unlit corridors (>14m from ceiling lights)
      if (closestCeilingLightDist > 14.0) {
        fearRate += 2.5;
        fearCause = 'darkness';
      }
    }

    // 2. Monster Proximity Calculation:
    if (nearestMonsterDist < 4.5) {
      fearRate += 34.0;
      fearCause = 'monster';
    } else if (nearestMonsterDist < 8.0) {
      fearRate += 22.0;
      fearCause = 'monster';
    } else if (nearestMonsterDist < 14.0) {
      fearRate += 11.0;
      if (fearCause !== 'darkness' || fearRate > 10.0) fearCause = 'monster';
    } else if (nearestMonsterDist < 20.0) {
      fearRate += 4.5;
      if (fearCause === 'none') fearCause = 'monster';
    }

    // Extra panic boost for Bosses and charging pursuers
    if ((nearestIsBoss || nearestIsAggressive) && nearestMonsterDist < 18.0) {
      fearRate += 12.0;
      fearCause = 'monster';
    }

    // 3. Recovery in Illuminated Safe Zones:
    if (nearestMonsterDist > 18.0 && (this.player.flashlightOn || closestCeilingLightDist < 8.0)) {
      const calmRate = this.player.isCrouching ? 16.0 : 10.0;
      fearRate -= calmRate;
    }

    // Update & clamp fear
    this.player.fear = Math.max(0, Math.min(this.player.maxFear, this.player.fear + fearRate * dt));
    if (this.player.fear >= 70) {
      fearCause = 'critical';
    } else if (fearRate <= 0 && this.player.fear < 15) {
      fearCause = 'none';
    }
    this.player.fearCause = fearCause;

    // Camera tremors & disorientation during critical fear
    if (this.player.fear >= 75) {
      const panicRatio = (this.player.fear - 75) / 25;
      const trembleX = (Math.random() - 0.5) * 0.02 * panicRatio;
      const trembleY = (Math.random() - 0.5) * 0.015 * panicRatio;
      this.camera.position.x += trembleX;
      this.camera.position.y += trembleY;
    }

    const isFlickering = nearestMonsterDist < 7.0 && Math.random() < 0.25;
    this.flashlight.intensity = this.player.flashlightOn && !isFlickering ? 3.4 : 0.05;
    if (this.flashlightConeMesh) {
      this.flashlightConeMesh.visible = this.player.flashlightOn && !isFlickering;
    }

    // Directional spotlight attached directly to player's camera/viewpoint, dynamically casting shadows
    this.flashlight.position.copy(this.camera.position);
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    this.flashlightTarget.position.copy(this.camera.position).add(camDir.clone().multiplyScalar(25));
    this.flashlightTarget.updateMatrixWorld();

    // 2. Weapon firing & Reload
    const now = performance.now() / 1000;
    const currentWeapon = this.player.weapons[this.player.currentWeaponId];
    if (this.isFiring && now - this.lastFireTime >= 1.0 / currentWeapon.fireRate) {
      this.lastFireTime = now;
      this.fireCurrentWeapon();
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const needed = currentWeapon.clipSize - currentWeapon.currentClip;
        const toLoad = Math.min(needed, currentWeapon.reserveAmmo);
        currentWeapon.currentClip += toLoad;
        currentWeapon.reserveAmmo -= toLoad;
        this.callbacks.onPlayerUpdate({ ...this.player });
      }
    }

    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      this.muzzleFlashLight.position.copy(this.camera.position).add(camDir.clone().multiplyScalar(0.5));
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // Active mechanics decay for Laser and Electric/Taser weapons
    if (this.laserTimer > 0) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0) {
        if (this.laserBeamMesh) this.laserBeamMesh.visible = false;
        this.laserImpactLight.intensity = 0;
      }
    }

    if (this.electricArcTimer > 0) {
      this.electricArcTimer -= dt;
      if (this.electricArcTimer <= 0) {
        if (this.electricArcSegments) this.electricArcSegments.visible = false;
      }
    }

    if (this.shockwaveTimer > 0) {
      this.shockwaveTimer = Math.max(0, this.shockwaveTimer - dt);
      const progress = 1 - this.shockwaveTimer / 0.45;
      if (this.shockwaveMesh) {
        this.shockwaveMesh.scale.setScalar(0.25 + progress * 12);
        const material = this.shockwaveMesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.42 * (1 - progress);
        if (this.shockwaveTimer === 0) this.shockwaveMesh.visible = false;
      }
    }

    // Weapon viewmodel bob & ADS position lerp
    const targetAimPos = this.isAiming
      ? new THREE.Vector3(0, -0.15, -0.35)
      : new THREE.Vector3(
          0.24 + Math.sin(this.weaponBobTime * 0.5) * 0.015,
          -0.22 + Math.abs(Math.sin(this.weaponBobTime)) * 0.015,
          -0.45
        );

    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), 0.15);
    targetAimPos.add(this.recoilOffset);

    if (this.currentWeaponMesh) {
      this.currentWeaponMesh.position.lerp(targetAimPos, 0.2);
    }

    // 3. Update Enemy AI & Rigs
    const noiseFactor = this.isFiring ? 3 : this.player.isSprinting ? 2 : this.player.isCrouching ? 0.2 : 1;
    this.levelData.enemies.forEach((enemy) => {
      const rig = this.enemyRigs.get(enemy.id);
      if (!rig) return;

      if (enemy.health > 0) {
        updateEnemyAI(enemy, this.playerPos, noiseFactor, dt, (damage) => {
          // Monster struck player!
          this.player.health = Math.max(0, this.player.health - damage);
          this.player.fear = Math.min(this.player.maxFear, this.player.fear + 18);
          horrorAudio.playPlayerDamage();
          this.postProcessor.triggerDamageGlitch(0.85);
          this.callbacks.onDamageFlash();
          this.callbacks.onPlayerUpdate({ ...this.player });

          if (this.player.health <= 0) {
            this.callbacks.onGameOver();
          }
        });

        // Update 3D mesh position and rotation
        rig.root.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        rig.root.rotation.y = enemy.rotation;

        // Limb & attack animations
        const isMoving = enemy.aiState === 'CHASE' || enemy.aiState === 'PATROL';
        const isAttacking = enemy.aiState === 'ATTACK';
        const walkCycle = this.clock.getElapsedTime() * (enemy.aiState === 'CHASE' ? 8 : 4);
        const attackCycle = this.clock.getElapsedTime() * 12;

        if (isAttacking) {
          if (enemy.type === 'boss_maryam') {
            // Maryam: dual clutching elongated claws strike forward
            rig.leftArm.rotation.x = -1.2 + Math.sin(attackCycle) * 0.45;
            rig.rightArm.rotation.x = -1.2 + Math.sin(attackCycle) * 0.45;
            rig.head.rotation.x = 0.25;
          } else if (enemy.type === 'boss_sarah') {
            // Sarah: mutated heavy barnacle claw sweeps forward violently
            rig.rightArm.rotation.x = -1.4 + Math.sin(attackCycle) * 0.65;
            rig.rightArm.rotation.y = Math.cos(attackCycle) * 0.4;
            rig.leftArm.rotation.x = -0.5;
            rig.head.rotation.x = 0.35;
          } else {
            // Followers: biting/claw lunging
            rig.leftArm.rotation.x = -0.9 + Math.sin(attackCycle) * 0.35;
            rig.rightArm.rotation.x = -0.9 + Math.cos(attackCycle) * 0.35;
          }
        } else if (isMoving) {
          rig.leftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
          rig.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.45;
          rig.leftArm.rotation.x = -Math.sin(walkCycle) * 0.35;
          rig.rightArm.rotation.x = Math.sin(walkCycle) * 0.35;
        }

        // Maryam entrails writhing motion
        if (rig.entrails) {
          const entrailSpeed = isAttacking ? 16 : isMoving ? 8 : 3;
          rig.entrails.forEach((entrail, i) => {
            entrail.rotation.z = Math.sin(this.clock.getElapsedTime() * entrailSpeed + i) * (isAttacking ? 0.35 : 0.18);
          });
        }

        // Sarah head twitch animation
        if (enemy.type === 'boss_sarah') {
          if (Math.random() < 0.08) {
            rig.head.rotation.z = (Math.random() - 0.5) * 0.4;
          }
        }

        // Hit reaction flinch
        if (enemy.hitReactionTimer > 0) {
          enemy.hitReactionTimer -= dt;
          rig.body.rotation.x = -0.25;
        } else if (!isAttacking) {
          rig.body.rotation.x = 0;
        }
      } else {
        // Dead: collapse to floor
        rig.root.rotation.x = THREE.MathUtils.lerp(rig.root.rotation.x, Math.PI / 2, 0.1);
        rig.root.position.y = THREE.MathUtils.lerp(rig.root.position.y, 0.15, 0.1);
      }
    });

    // 4. Update Interactive Doors (smooth slide/swing)
    this.levelData.interactiveDoors.forEach((door) => {
      const doorGroup = this.activeDoors.get(door.id);
      if (!doorGroup) return;

      const targetProgress = door.isOpen ? 1.0 : 0.0;
      door.openProgress = THREE.MathUtils.lerp(door.openProgress, targetProgress, 0.1);

      // Slide door panel open along X
      doorGroup.children[0].position.x = door.openProgress * 2.2;
    });

    // 5. Item Collection check
    this.levelData.items.forEach((item) => {
      if (item.collected) return;
      const dist = Math.hypot(item.position.x - this.playerPos.x, item.position.z - this.playerPos.z);
      if (dist < 1.4) {
        item.collected = true;
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) this.scene.remove(mesh);

        if (item.type === 'coin') {
          const val = item.value || 50;
          this.player.coins += val;
          this.persistCoins();
          horrorAudio.playCoinPickup();
          this.callbacks.onPromptUpdate(`+${val} NIGHT COINS`);
        } else if (item.type === 'keycard') {
          if (item.keyId) this.player.inventory.keycards.push(item.keyId);
          horrorAudio.playItemPickup();
          this.callbacks.onPromptUpdate(`Acquired ${item.name}!`);
        } else if (item.type === 'medkit') {
          this.player.inventory.medkits++;
          horrorAudio.playItemPickup();
          this.callbacks.onPromptUpdate(`Acquired ${item.name}!`);
        } else if (item.type === 'battery') {
          this.player.battery = Math.min(this.player.maxBattery, this.player.battery + 50);
          horrorAudio.playItemPickup();
          this.callbacks.onPromptUpdate(`Recharged Flashlight Battery!`);
        } else if (item.type === 'ammo_pistol' || item.type === 'ammo_shotgun' || item.type === 'ammo_rifle') {
          const weaponId = item.type.slice('ammo_'.length) as 'pistol' | 'shotgun' | 'rifle';
          const weapon = this.player.weapons[weaponId];
          const requested = Math.max(0, Math.floor(item.value ?? 0));
          const gained = Math.min(requested, weapon.maxReserve - weapon.reserveAmmo);
          weapon.reserveAmmo += gained;
          horrorAudio.playItemPickup();
          this.callbacks.onPromptUpdate(
            gained > 0 ? `+${gained} ${weapon.name} ammo` : `${weapon.name} ammo is full`
          );
        } else {
          horrorAudio.playItemPickup();
          this.callbacks.onPromptUpdate(`Collected ${item.name}!`);
        }

        this.callbacks.onPlayerUpdate({ ...this.player });
      } else {
        // Floating bob animation for items
        const mesh = this.itemMeshes.get(item.id);
        if (mesh) {
          mesh.rotation.y += dt * 1.5;
          mesh.position.y = item.position.y + Math.sin(this.clock.getElapsedTime() * 3) * 0.08;
        }
      }
    });

    // 6. Blood particles gravity & update
    for (let i = 0; i < this.bloodParticlePositions.length / 3; i++) {
      if (this.bloodParticlePositions[i * 3 + 1] > 0) {
        this.bloodParticlePositions[i * 3] += this.bloodParticleVelocities[i * 3] * dt;
        this.bloodParticlePositions[i * 3 + 1] += this.bloodParticleVelocities[i * 3 + 1] * dt;
        this.bloodParticlePositions[i * 3 + 2] += this.bloodParticleVelocities[i * 3 + 2] * dt;
        this.bloodParticleVelocities[i * 3 + 1] -= 9.8 * dt; // gravity

        if (this.bloodParticlePositions[i * 3 + 1] <= 0.05) {
          this.bloodParticlePositions[i * 3 + 1] = 0.05; // splat on ground
        }
      }
    }
    this.bloodParticles.geometry.attributes.position.needsUpdate = true;

    // Heartbeat & Fear audio update
    const healthRatio = this.player.health / this.player.maxHealth;
    const fearRatio = this.player.fear / this.player.maxFear;

    horrorAudio.updateHeartbeat(healthRatio);
    horrorAudio.updateFear(fearRatio);

    // Update custom Horror Shader Pass uniforms (time, damage glitch, health distress, critical fear blur/distortion)
    if (this.postProcessor) {
      this.postProcessor.update(dt, healthRatio, fearRatio);
    }

    // Periodic smooth reactive HUD update ticker
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.08) {
      this.hudUpdateTimer = 0;
      this.callbacks.onPlayerUpdate({ ...this.player });
    }
  }

  private render() {
    if (this.postProcessor) {
      this.postProcessor.render(this.renderer, this.scene, this.camera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.filmGrainEnabled !== undefined && this.postProcessor) {
      this.postProcessor.setEnabled(newSettings.filmGrainEnabled);
    }
    if (newSettings.graphicsQuality !== undefined && this.postProcessor) {
      this.postProcessor.setQuality(newSettings.graphicsQuality);
      const pixelRatio = this.getPixelRatio();
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.shadowMap.enabled = newSettings.graphicsQuality !== 'low';
      this.flashlight.castShadow = newSettings.graphicsQuality !== 'low';
      const shadowMapSize = newSettings.graphicsQuality === 'high' ? 1024 : 512;
      this.flashlight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
      this.flashlight.shadow.needsUpdate = true;
      this.postProcessor.setSize(
        Math.max(1, this.container.clientWidth || window.innerWidth),
        Math.max(1, this.container.clientHeight || window.innerHeight),
        pixelRatio
      );
    }
  }

  public useMedkit() {
    if (this.player.inventory.medkits > 0 && (this.player.health < this.player.maxHealth || this.player.fear > 20)) {
      this.player.inventory.medkits--;
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 45);
      this.player.fear = Math.max(0, this.player.fear - 35);
      horrorAudio.playItemPickup();
      this.callbacks.onPromptUpdate('Used First Aid Medkit (+45 HP / -35 Fear)');
      this.callbacks.onPlayerUpdate({ ...this.player });
    }
  }

  public buyItem(type: string, cost: number, payload?: { weaponId?: WeaponId }) {
    let expectedCost: number;
    switch (type) {
      case 'ammo_pistol':
        expectedCost = 80;
        if (this.player.weapons.pistol.reserveAmmo >= this.player.weapons.pistol.maxReserve) return false;
        break;
      case 'ammo_shotgun':
        expectedCost = 120;
        if (this.player.weapons.shotgun.reserveAmmo >= this.player.weapons.shotgun.maxReserve) return false;
        break;
      case 'ammo_rifle':
        expectedCost = 150;
        if (this.player.weapons.rifle.reserveAmmo >= this.player.weapons.rifle.maxReserve) return false;
        break;
      case 'medkit':
        expectedCost = 100;
        break;
      case 'unlock_weapon': {
        const weapon = payload?.weaponId ? this.player.weapons[payload.weaponId] : undefined;
        if (!weapon || weapon.isUnlocked) return false;
        expectedCost = weapon.cost;
        break;
      }
      case 'upgrade_damage': {
        const weapon = payload?.weaponId ? this.player.weapons[payload.weaponId] : undefined;
        if (!weapon || !weapon.isUnlocked || weapon.upgradeTier >= 2) return false;
        expectedCost = 300 * (weapon.upgradeTier + 1);
        break;
      }
      default:
        return false;
    }

    if (!Number.isFinite(cost) || cost !== expectedCost || this.player.coins < cost) return false;
    this.player.coins -= cost;
    this.persistCoins();

    if (type === 'ammo_pistol') {
      this.player.weapons.pistol.reserveAmmo = Math.min(this.player.weapons.pistol.maxReserve, this.player.weapons.pistol.reserveAmmo + 24);
    } else if (type === 'ammo_shotgun') {
      this.player.weapons.shotgun.reserveAmmo = Math.min(this.player.weapons.shotgun.maxReserve, this.player.weapons.shotgun.reserveAmmo + 12);
    } else if (type === 'ammo_rifle') {
      this.player.weapons.rifle.reserveAmmo = Math.min(this.player.weapons.rifle.maxReserve, this.player.weapons.rifle.reserveAmmo + 60);
    } else if (type === 'medkit') {
      this.player.inventory.medkits++;
    } else if (type === 'unlock_weapon' && payload?.weaponId) {
      this.player.weapons[payload.weaponId].isUnlocked = true;
      this.persistUnlockedWeapons();
    } else if (type === 'upgrade_damage' && payload?.weaponId) {
      this.player.weapons[payload.weaponId].upgradeTier = Math.min(2, this.player.weapons[payload.weaponId].upgradeTier + 1);
    }

    horrorAudio.playCoinPickup();
    this.callbacks.onPlayerUpdate({ ...this.player });
    return true;
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);

    // Deep disposal of scene objects & WebGL resources for mobile memory optimization
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });

    if (this.postProcessor) {
      this.postProcessor.dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
