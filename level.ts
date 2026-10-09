import * as THREE from 'three';
import { InteractiveDoor, LevelItem, EnemyInstance } from './types';
import { NavObstacle } from './pathfinding';

export interface LevelData {
  walls: THREE.Group;
  floors: THREE.Group;
  lights: THREE.Group;
  interactiveDoors: InteractiveDoor[];
  items: LevelItem[];
  enemies: EnemyInstance[];
  obstacles: NavObstacle[];
  playerSpawn: { x: number; y: number; z: number };
}

/**
 * Builds Chapter 1: Sector 4 Facility Environment
 */
export function buildChapter1Level(): LevelData {
  const walls = new THREE.Group();
  walls.name = 'Level_Walls';

  const floors = new THREE.Group();
  floors.name = 'Level_Floors';

  const lights = new THREE.Group();
  lights.name = 'Level_Lights';

  const obstacles: NavObstacle[] = [];
  const interactiveDoors: InteractiveDoor[] = [];
  const items: LevelItem[] = [];
  const enemies: EnemyInstance[] = [];

  // Procedural concrete wall texture
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 512;
  wallCanvas.height = 512;
  const wctx = wallCanvas.getContext('2d')!;
  wctx.fillStyle = '#1c2024';
  wctx.fillRect(0, 0, 512, 512);

  // Dirt, grime, water stains
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    wctx.fillStyle = Math.random() > 0.5 ? 'rgba(10, 12, 14, 0.25)' : 'rgba(35, 42, 48, 0.2)';
    wctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }

  // Caution hazard stripes near bottom
  wctx.fillStyle = '#946618';
  for (let x = 0; x < 512; x += 32) {
    wctx.beginPath();
    wctx.moveTo(x, 480);
    wctx.lineTo(x + 16, 512);
    wctx.lineTo(x + 32, 512);
    wctx.lineTo(x + 16, 480);
    wctx.fill();
  }

  const wallTexture = new THREE.CanvasTexture(wallCanvas);
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;

  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    color: 0x9099a0,
    roughness: 0.85,
    metalness: 0.2,
  });

  // Floor Material (metallic industrial tiles with wet sheen)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 256;
  floorCanvas.height = 256;
  const fctx = floorCanvas.getContext('2d')!;
  fctx.fillStyle = '#0f1214';
  fctx.fillRect(0, 0, 256, 256);
  fctx.strokeStyle = '#1d2226';
  fctx.lineWidth = 4;
  fctx.strokeRect(0, 0, 256, 256);

  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(20, 20);

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.35,
    metalness: 0.7,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x14181c,
    roughness: 0.9,
  });

  // Helper to place walls and record navigation obstacles
  const addWall = (x: number, z: number, width: number, depth: number, height: number = 3.6) => {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geom, wallMaterial);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    walls.add(mesh);

    // Obstacle bounding box with margin
    obstacles.push({
      minX: x - width / 2 - 0.4,
      maxX: x + width / 2 + 0.4,
      minZ: z - depth / 2 - 0.4,
      maxZ: z + depth / 2 + 0.4,
    });
  };

  // Helper to place ceiling lights
  const addCeilingLight = (x: number, y: number, z: number, color: number = 0xffe8c7, intensity: number = 0.8, distance: number = 10) => {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x, y, z);
    light.castShadow = true;
    lights.add(light);

    // Lamp fixture mesh
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.5 })
    );
    fixture.position.set(x, 3.55, z);
    lights.add(fixture);

    // Bulb glow strip
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.2),
      new THREE.MeshBasicMaterial({ color })
    );
    bulb.position.set(x, 3.48, z);
    lights.add(bulb);
  };

  // ---------------- FLOOR & CEILING ----------------
  const floorGeom = new THREE.PlaneGeometry(80, 80);
  floorGeom.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeom, floorMaterial);
  floorMesh.receiveShadow = true;
  floors.add(floorMesh);

  const ceilingGeom = new THREE.PlaneGeometry(80, 80);
  ceilingGeom.rotateX(Math.PI / 2);
  const ceilingMesh = new THREE.Mesh(ceilingGeom, ceilingMaterial);
  ceilingMesh.position.y = 3.6;
  floors.add(ceilingMesh);

  // ---------------- OUTER PERIMETER BOUNDARIES ----------------
  addWall(0, -35, 70, 1.2); // North outer wall
  addWall(0, 35, 70, 1.2);  // South outer wall
  addWall(-35, 0, 1.2, 70); // West outer wall
  addWall(35, 0, 1.2, 70);  // East outer wall

  // ---------------- ZONE 1: AIRLOCK & SECURITY HUB (-20 to -5, -20 to -5) ----------------
  // North wall of Zone 1 with doorway
  addWall(-18, -20, 14, 1.0);
  addWall(-7, -20, 6, 1.0); // gap at -10 for door

  // South wall of Zone 1
  addWall(-18, -5, 14, 1.0);
  addWall(-7, -5, 6, 1.0);

  // East wall of Zone 1
  addWall(-5, -16, 1.0, 8);
  addWall(-5, -7, 1.0, 6);

  // Lighting for Zone 1
  addCeilingLight(-15, 3.4, -13, 0xfff0dd, 0.8, 12);
  addCeilingLight(-10, 3.4, -13, 0xef4444, 0.9, 10); // Red emergency light

  // ---------------- ZONE 2: SPECIMEN RESEARCH WING (-20 to -5, 0 to 25) ----------------
  // Autopsy corridor and lab chambers
  addWall(-20, 0, 16, 1.0);
  addWall(-5, 8, 1.0, 16);
  addWall(-20, 20, 16, 1.0);

  // Pillar obstacles in lab
  addWall(-14, 8, 1.5, 1.5);
  addWall(-14, 14, 1.5, 1.5);

  // Lab lighting (cold clinical blue-white)
  addCeilingLight(-14, 3.4, 5, 0xcbe5ff, 0.85, 12);
  addCeilingLight(-14, 3.4, 15, 0xcbe5ff, 0.85, 12);

  // ---------------- ZONE 3: FLOODED STORAGE VAULT (5 to 30, -25 to 0) ----------------
  addWall(5, -25, 1.0, 18);
  addWall(5, -5, 1.0, 10);
  addWall(18, 0, 26, 1.0);

  // Storage crates / containers (obstacles)
  addWall(12, -18, 3.0, 2.0, 2.2);
  addWall(22, -15, 2.5, 3.5, 2.2);
  addWall(16, -8, 4.0, 2.0, 2.2);

  // Flickering sodium lights
  addCeilingLight(12, 3.4, -12, 0xfde047, 0.7, 11);
  addCeilingLight(24, 3.4, -12, 0xfde047, 0.75, 12);

  // ---------------- ZONE 4: QUARANTINE SANCTUM / BOSS ARENA (5 to 30, 5 to 30) ----------------
  // Giant chamber where Maryam or Sarah stalks the player
  addWall(5, 12, 1.0, 14);
  addWall(5, 26, 1.0, 8);
  addWall(18, 5, 26, 1.0);

  // Arena containment pillars
  addWall(12, 12, 2.0, 2.0);
  addWall(24, 12, 2.0, 2.0);
  addWall(12, 24, 2.0, 2.0);
  addWall(24, 24, 2.0, 2.0);

  // Central ominous blood red spotlight
  addCeilingLight(18, 3.4, 18, 0xff2222, 1.4, 18);
  addCeilingLight(12, 3.4, 18, 0x93c5fd, 0.5, 10);
  addCeilingLight(24, 3.4, 18, 0x93c5fd, 0.5, 10);

  // ---------------- CENTRAL CONNECTING CORRIDORS ----------------
  addWall(0, -10, 1.0, 10);
  addWall(0, 10, 1.0, 10);

  // Central corridor lighting
  addCeilingLight(0, 3.4, 0, 0xffffff, 0.6, 9);
  addCeilingLight(-5, 3.4, 0, 0xffedd5, 0.5, 8);
  addCeilingLight(5, 3.4, 0, 0xffedd5, 0.5, 8);

  // ---------------- INTERACTIVE DOORS ----------------
  // Door 1: Airlock to Central Corridor (Unlocked)
  interactiveDoors.push({
    id: 'door_airlock',
    position: { x: -5, y: 0, z: -11 },
    rotation: Math.PI / 2,
    isOpen: false,
    isLocked: false,
    name: 'Sector Airlock Gate',
    openProgress: 0,
  });

  // Door 2: Specimen Lab Door (Requires Blue Keycard)
  interactiveDoors.push({
    id: 'door_lab',
    position: { x: -5, y: 0, z: 4 },
    rotation: Math.PI / 2,
    isOpen: false,
    isLocked: true,
    requiredKey: 'lab_key',
    name: 'Research Lab Security Door',
    openProgress: 0,
  });

  // Door 3: Flooded Vault Door
  interactiveDoors.push({
    id: 'door_vault',
    position: { x: 5, y: 0, z: -13 },
    rotation: Math.PI / 2,
    isOpen: false,
    isLocked: false,
    name: 'Vault Sliding Partition',
    openProgress: 0,
  });

  // Door 4: Quarantine Sanctum Blast Gate (Requires Red Quarantine Key)
  interactiveDoors.push({
    id: 'door_quarantine',
    position: { x: 5, y: 0, z: 20 },
    rotation: Math.PI / 2,
    isOpen: false,
    isLocked: true,
    requiredKey: 'quarantine_key',
    name: 'Quarantine Heavy Blast Door',
    openProgress: 0,
  });

  // ---------------- LEVEL ITEMS & LOOT ----------------
  // Zone 1 Items (Airlock starter room)
  items.push(
    { id: 'item_pistol_ammo_1', type: 'ammo_pistol', name: '9mm Pistol Rounds', position: { x: -17, y: 0.5, z: -16 }, value: 24, collected: false },
    { id: 'item_medkit_1', type: 'medkit', name: 'First Aid Medical Kit', position: { x: -17, y: 0.5, z: -10 }, value: 1, collected: false },
    { id: 'item_coin_1', type: 'coin', name: 'Night Coins Safe Cache', position: { x: -12, y: 0.5, z: -17 }, value: 150, collected: false }
  );

  // Zone 2 Items (Lab - holds Blue Keycard!)
  items.push(
    { id: 'item_key_lab', type: 'keycard', name: 'Blue Security Keycard', position: { x: -14, y: 0.7, z: 22 }, keyId: 'lab_key', collected: false },
    { id: 'item_shotgun_ammo_1', type: 'ammo_shotgun', name: '12-Gauge Buckshot', position: { x: -18, y: 0.5, z: 12 }, value: 12, collected: false },
    { id: 'item_coin_2', type: 'coin', name: 'Specimen Locker Coins', position: { x: -8, y: 0.5, z: 18 }, value: 220, collected: false }
  );

  // Zone 3 Items (Flooded Storage Vault - holds Red Quarantine Key!)
  items.push(
    { id: 'item_key_quarantine', type: 'keycard', name: 'Red Quarantine Keycard', position: { x: 26, y: 0.7, z: -20 }, keyId: 'quarantine_key', collected: false },
    { id: 'item_rifle_ammo_1', type: 'ammo_rifle', name: '5.56mm Assault Magazine', position: { x: 18, y: 0.5, z: -15 }, value: 60, collected: false },
    { id: 'item_battery_1', type: 'battery', name: 'Industrial Lithium Cell', position: { x: 10, y: 0.5, z: -6 }, value: 50, collected: false },
    { id: 'item_coin_3', type: 'coin', name: 'Storage Vault Night Coins', position: { x: 22, y: 0.5, z: -8 }, value: 300, collected: false }
  );

  // Zone 4 Items (Quarantine Sanctum supply caches)
  items.push(
    { id: 'item_medkit_2', type: 'medkit', name: 'Trauma Medkit', position: { x: 12, y: 0.5, z: 28 }, value: 1, collected: false },
    { id: 'item_shotgun_ammo_2', type: 'ammo_shotgun', name: '12-Gauge Buckshot Box', position: { x: 26, y: 0.5, z: 8 }, value: 16, collected: false },
    { id: 'item_coin_4', type: 'coin', name: 'Ancient Night Tide Relic', position: { x: 18, y: 0.5, z: 26 }, value: 500, collected: false }
  );

  // ---------------- ENEMIES SPAWNED IN MAP ----------------
  // Follower 1: Crawler stalking hallway near Lab
  enemies.push({
    id: 'enemy_crawler_1',
    type: 'follower_crawler',
    name: 'Visceral Lurker',
    nameAr: 'المتربص الحشوي',
    health: 75,
    maxHealth: 75,
    speed: 2.2,
    runSpeed: 4.5,
    damage: 15,
    attackRange: 1.4,
    attackCooldown: 1.2,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: -14, y: 0, z: 5 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: -14, z: 2 },
      { x: -14, z: 18 },
      { x: -8, z: 12 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: false,
    bossPhase: 1,
    detectionRange: 12,
    hearingRange: 10,
    hitReactionTimer: 0,
    dropCoins: 45,
  });

  // Follower 2: Blooded Shambler guarding Lab Keycard
  enemies.push({
    id: 'enemy_shambler_1',
    type: 'follower_shambler',
    name: 'Blooded Shambler',
    nameAr: 'المتسارع الملطخ',
    health: 120,
    maxHealth: 120,
    speed: 1.8,
    runSpeed: 3.8,
    damage: 22,
    attackRange: 1.8,
    attackCooldown: 1.5,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: -16, y: 0, z: 18 },
    rotation: Math.PI / 2,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: -16, z: 18 },
      { x: -8, z: 18 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: false,
    bossPhase: 1,
    detectionRange: 14,
    hearingRange: 12,
    hitReactionTimer: 0,
    dropCoins: 60,
  });

  // Follower 3: Shore Stalker in Flooded Storage Vault
  enemies.push({
    id: 'enemy_stalker_1',
    type: 'follower_stalker',
    name: 'Shore Stalker',
    nameAr: 'صائد الشاطئ',
    health: 95,
    maxHealth: 95,
    speed: 2.5,
    runSpeed: 4.8,
    damage: 18,
    attackRange: 1.6,
    attackCooldown: 1.1,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: 18, y: 0, z: -12 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: 10, z: -18 },
      { x: 24, z: -18 },
      { x: 18, z: -6 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: false,
    bossPhase: 1,
    detectionRange: 15,
    hearingRange: 14,
    hitReactionTimer: 0,
    dropCoins: 75,
  });

  // Follower 4: Sunken Heavy brute guarding Vault Safe
  enemies.push({
    id: 'enemy_brute_1',
    type: 'follower_brute',
    name: 'Sunken Heavy',
    nameAr: 'العملاق الغارق',
    health: 220,
    maxHealth: 220,
    speed: 1.4,
    runSpeed: 2.8,
    damage: 35,
    attackRange: 2.1,
    attackCooldown: 2.0,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: 24, y: 0, z: -18 },
    rotation: -Math.PI / 2,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: 24, z: -18 },
      { x: 24, z: -8 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: false,
    bossPhase: 1,
    detectionRange: 12,
    hearingRange: 11,
    hitReactionTimer: 0,
    dropCoins: 110,
  });

  // ---------------- MAIN BOSS: MARYAM (The White Horror) ----------------
  // Positioned in the Quarantine Sanctum!
  enemies.push({
    id: 'boss_maryam_main',
    type: 'boss_maryam',
    name: 'Maryam — The White Horror',
    nameAr: 'مريم — الرعب الأبيض',
    health: 650,
    maxHealth: 650,
    speed: 1.7,
    runSpeed: 5.2, // sudden berserk burst of speed
    damage: 42,
    attackRange: 2.4,
    attackCooldown: 1.4,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: 18, y: 0, z: 20 },
    rotation: Math.PI,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: 12, z: 14 },
      { x: 24, z: 14 },
      { x: 24, z: 24 },
      { x: 12, z: 24 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: true,
    bossPhase: 1,
    detectionRange: 18,
    hearingRange: 16,
    hitReactionTimer: 0,
    dropCoins: 1000,
  });

  // Second Boss: Sarah (Can also be spawned in Sarah's domain or arena)
  enemies.push({
    id: 'boss_sarah_main',
    type: 'boss_sarah',
    name: 'Sarah — The Sunken Tide',
    nameAr: 'سارة — مد الظلال الغارق',
    health: 600,
    maxHealth: 600,
    speed: 2.4,
    runSpeed: 5.6,
    damage: 40,
    attackRange: 2.2,
    attackCooldown: 1.2,
    lastAttackTime: 0,
    aiState: 'PATROL',
    position: { x: 22, y: 0, z: 24 },
    rotation: 0,
    velocity: { x: 0, y: 0, z: 0 },
    targetPosition: null,
    lastKnownPlayerPos: null,
    patrolWaypoints: [
      { x: 22, z: 24 },
      { x: 14, z: 22 },
      { x: 14, z: 12 },
    ],
    currentWaypointIndex: 0,
    searchTimer: 0,
    stunTimer: 0,
    isBoss: true,
    bossPhase: 1,
    detectionRange: 19,
    hearingRange: 18,
    hitReactionTimer: 0,
    dropCoins: 1200,
  });

  // Player starting spawn in Zone 1 (Airlock)
  const playerSpawn = { x: -14, y: 1.7, z: -12 };

  return {
    walls,
    floors,
    lights,
    interactiveDoors,
    items,
    enemies,
    obstacles,
    playerSpawn,
  };
}
