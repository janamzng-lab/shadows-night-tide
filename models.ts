import * as THREE from 'three';
import { EnemyType, WeaponId } from './types';

/**
 * 3D Procedural Mesh & Character Rigging Builder for SHADOWS: NIGHT TIDE
 * Crafts distinct 3D models with true geometry, depth, materials, and joint articulation.
 */

// Texture generator helpers for horror surfaces
function createBloodClothTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base off-white decayed fabric
  ctx.fillStyle = '#cfc9be';
  ctx.fillRect(0, 0, 256, 256);

  // Dirt & grime noise
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 3 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60, 50, 40, 0.15)' : 'rgba(30, 25, 20, 0.1)';
    ctx.fillRect(x, y, size, size);
  }

  // Blood splatters & stains
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 256;
    const y = 80 + Math.random() * 170; // concentrated lower
    const rad = Math.random() * 18 + 4;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, 'rgba(120, 10, 10, 0.7)');
    grad.addColorStop(0.7, 'rgba(70, 5, 5, 0.4)');
    grad.addColorStop(1, 'rgba(50, 5, 5, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createVisceraTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a0808';
  ctx.fillRect(0, 0, 128, 128);

  // Veins & glistening tissue
  ctx.strokeStyle = '#8f1a1a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 128, Math.random() * 128);
    ctx.bezierCurveTo(
      Math.random() * 128, Math.random() * 128,
      Math.random() * 128, Math.random() * 128,
      Math.random() * 128, Math.random() * 128
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createBarnacleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#242a2e'; // dark submerged ocean rock
  ctx.fillRect(0, 0, 256, 256);

  // Barnacle clusters
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rad = Math.random() * 6 + 2;
    ctx.fillStyle = '#5c646b';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Barnacle dark center hole
    ctx.fillStyle = '#111518';
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Cached materials
const bloodClothTex = createBloodClothTexture();
const visceraTex = createVisceraTexture();
const barnacleTex = createBarnacleTexture();

export interface EnemyMeshRig {
  root: THREE.Group;
  head: THREE.Object3D;
  body: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  entrails?: THREE.Object3D[];
  eyeLights?: THREE.PointLight[];
}

/**
 * Builds Maryam — The White Horror
 * - Tall slender deformed silhouette (~2.4 units)
 * - Tattered white bloodied gown / shroud
 * - Exposed hollowed abdomen with hanging coiled viscera/entrails
 * - Elongated pale arms with bloody claws
 * - Pale skull with sunken hollow eyes
 */
export function buildMaryamBossMesh(): EnemyMeshRig {
  const root = new THREE.Group();
  root.name = 'Maryam_Rig';

  // Materials
  const paleSkinMat = new THREE.MeshStandardMaterial({
    color: 0xddd7cf,
    roughness: 0.65,
    metalness: 0.05,
  });

  const whiteShroudMat = new THREE.MeshStandardMaterial({
    map: bloodClothTex,
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const entrailsMat = new THREE.MeshStandardMaterial({
    map: visceraTex,
    color: 0xa81e1e,
    roughness: 0.25,
    metalness: 0.2, // wet glistens
  });

  // Body container
  const body = new THREE.Group();
  body.position.y = 1.2;
  root.add(body);

  // Torso upper (chest & shoulders)
  const chestGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.55, 10);
  const chestMesh = new THREE.Mesh(chestGeom, whiteShroudMat);
  chestMesh.castShadow = true;
  body.add(chestMesh);

  // Hollowed Ribcage Cavity (exposed interior)
  const cavityGeom = new THREE.BoxGeometry(0.3, 0.4, 0.22);
  const cavityMat = new THREE.MeshStandardMaterial({ color: 0x240202, roughness: 0.9 });
  const cavityMesh = new THREE.Mesh(cavityGeom, cavityMat);
  cavityMesh.position.set(0, -0.3, 0.05);
  body.add(cavityMesh);

  // White Shroud / Ragged Gown Lower skirt
  const skirtGeom = new THREE.ConeGeometry(0.55, 1.3, 12, 1, true);
  skirtGeom.rotateX(Math.PI);
  const skirtMesh = new THREE.Mesh(skirtGeom, whiteShroudMat);
  skirtMesh.position.set(0, -0.7, 0);
  skirtMesh.castShadow = true;
  body.add(skirtMesh);

  // EXPOSED ENTRAILS: Distinct loops and hanging viscera cords
  const entrailNodes: THREE.Object3D[] = [];
  const entrailOffsets = [
    [-0.08, -0.22, 0.12],
    [0.05, -0.35, 0.14],
    [-0.03, -0.45, 0.1],
    [0.08, -0.28, 0.13],
    [0, -0.55, 0.08],
  ];

  entrailOffsets.forEach(([ox, oy, oz], idx) => {
    const entrailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ox, oy, oz),
      new THREE.Vector3(ox + (Math.random() - 0.5) * 0.12, oy - 0.18, oz + 0.08),
      new THREE.Vector3(ox + (Math.random() - 0.5) * 0.15, oy - 0.38, oz + 0.04),
    ]);
    const entrailGeom = new THREE.TubeGeometry(entrailCurve, 12, 0.028 + idx * 0.005, 8, false);
    const entrailMesh = new THREE.Mesh(entrailGeom, entrailsMat);
    entrailMesh.castShadow = true;
    body.add(entrailMesh);
    entrailNodes.push(entrailMesh);
  });

  // Neck and Head
  const neckGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8);
  const neckMesh = new THREE.Mesh(neckGeom, paleSkinMat);
  neckMesh.position.y = 0.35;
  body.add(neckMesh);

  const head = new THREE.Group();
  head.position.y = 0.55;
  body.add(head);

  // Distorted skull
  const skullGeom = new THREE.SphereGeometry(0.18, 12, 12);
  skullGeom.scale(0.85, 1.25, 1.0);
  const skullMesh = new THREE.Mesh(skullGeom, paleSkinMat);
  head.add(skullMesh);

  // Hollow eye sockets & ominous red pinprick glows
  const eyeLights: THREE.PointLight[] = [];
  [-0.07, 0.07].forEach((eyeX) => {
    const eyeSocket = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x050000 })
    );
    eyeSocket.position.set(eyeX, 0.04, 0.15);
    head.add(eyeSocket);

    const eyeGlow = new THREE.PointLight(0xff1111, 0.6, 2.5);
    eyeGlow.position.set(eyeX, 0.04, 0.18);
    head.add(eyeGlow);
    eyeLights.push(eyeGlow);
  });

  // Stringy white veil / hair strands
  const veilGeom = new THREE.BoxGeometry(0.35, 0.6, 0.25);
  const veilMat = new THREE.MeshStandardMaterial({
    color: 0xedebe8,
    roughness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const veilMesh = new THREE.Mesh(veilGeom, veilMat);
  veilMesh.position.set(0, -0.15, -0.05);
  head.add(veilMesh);

  // Elongated Pale Arms
  const armGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.85, 8);
  const handGeom = new THREE.BoxGeometry(0.08, 0.22, 0.04);
  const clawMat = new THREE.MeshStandardMaterial({ color: 0x5e0808, roughness: 0.5 });

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.2, 0);
  const leftArmMesh = new THREE.Mesh(armGeom, paleSkinMat);
  leftArmMesh.position.y = -0.4;
  leftArm.add(leftArmMesh);
  const leftClaw = new THREE.Mesh(handGeom, clawMat);
  leftClaw.position.y = -0.85;
  leftArm.add(leftClaw);
  body.add(leftArm);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.2, 0);
  const rightArmMesh = new THREE.Mesh(armGeom, paleSkinMat);
  rightArmMesh.position.y = -0.4;
  rightArm.add(rightArmMesh);
  const rightClaw = new THREE.Mesh(handGeom, clawMat);
  rightClaw.position.y = -0.85;
  rightArm.add(rightClaw);
  body.add(rightArm);

  // Legs under shroud
  const legGeom = new THREE.CylinderGeometry(0.06, 0.05, 1.1, 8);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  const leftLegMesh = new THREE.Mesh(legGeom, paleSkinMat);
  leftLegMesh.position.y = -0.55;
  leftLeg.add(leftLegMesh);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  const rightLegMesh = new THREE.Mesh(legGeom, paleSkinMat);
  rightLegMesh.position.y = -0.55;
  rightLeg.add(rightLegMesh);
  root.add(rightLeg);

  return { root, head, body, leftArm, rightArm, leftLeg, rightLeg, entrails: entrailNodes, eyeLights };
}

/**
 * Builds Sarah — The Second Boss
 * - Sunken shore anomaly with mutated coastal shell & calcified barnacle armor
 * - Large mutated barnacle claw on right arm
 * - Long stringy wet dark hair hanging over face
 * - Drowned dark seaweed shroud / tattered fabric
 * - Twitching erratic posture & predatory eyes
 */
export function buildSarahBossMesh(): EnemyMeshRig {
  const root = new THREE.Group();
  root.name = 'Sarah_Rig';

  const drownedFleshMat = new THREE.MeshStandardMaterial({
    color: 0x5a6a6e, // greyish blue drowned skin
    roughness: 0.5,
    metalness: 0.15,
  });

  const barnacleShellMat = new THREE.MeshStandardMaterial({
    map: barnacleTex,
    color: 0x3d474d,
    roughness: 0.9,
    metalness: 0.1,
  });

  const seaweedClothMat = new THREE.MeshStandardMaterial({
    color: 0x1f2924,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  const body = new THREE.Group();
  body.position.y = 1.1;
  root.add(body);

  // Torso
  const torsoGeom = new THREE.CylinderGeometry(0.26, 0.22, 0.6, 10);
  const torsoMesh = new THREE.Mesh(torsoGeom, seaweedClothMat);
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Calcified barnacle shoulder shell plates
  const shellPlateGeom = new THREE.SphereGeometry(0.24, 8, 8);
  shellPlateGeom.scale(1.2, 0.8, 1.0);
  const rightShoulderShell = new THREE.Mesh(shellPlateGeom, barnacleShellMat);
  rightShoulderShell.position.set(0.3, 0.25, 0);
  body.add(rightShoulderShell);

  // Wet ragged seaweed skirt
  const skirtGeom = new THREE.ConeGeometry(0.5, 1.1, 10, 1, true);
  skirtGeom.rotateX(Math.PI);
  const skirtMesh = new THREE.Mesh(skirtGeom, seaweedClothMat);
  skirtMesh.position.set(0, -0.65, 0);
  skirtMesh.castShadow = true;
  body.add(skirtMesh);

  // Head with wet hair
  const head = new THREE.Group();
  head.position.y = 0.45;
  body.add(head);

  const headGeom = new THREE.SphereGeometry(0.18, 10, 10);
  const headMesh = new THREE.Mesh(headGeom, drownedFleshMat);
  head.add(headMesh);

  // Long wet black stringy hair covering face
  const hairGeom = new THREE.ConeGeometry(0.25, 0.65, 8);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: 0.3 });
  const hairMesh = new THREE.Mesh(hairGeom, hairMat);
  hairMesh.position.set(0, -0.15, 0.05);
  hairMesh.rotation.x = 0.2;
  head.add(hairMesh);

  // Bioluminescent yellow-green predator eyes
  const eyeLights: THREE.PointLight[] = [];
  [-0.06, 0.06].forEach((x) => {
    const eye = new THREE.PointLight(0xa3e635, 0.7, 3.0);
    eye.position.set(x, 0.02, 0.16);
    head.add(eye);
    eyeLights.push(eye);
  });

  // Left Arm (thin drowned pale arm)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.15, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.8, 8), drownedFleshMat);
  leftArmMesh.position.y = -0.4;
  leftArm.add(leftArmMesh);
  body.add(leftArm);

  // Right Arm: HUGE MUTATED BARNACLE CRAB CLAW
  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.15, 0);
  const clawArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8), barnacleShellMat);
  clawArmMesh.position.y = -0.32;
  rightArm.add(clawArmMesh);

  // Massive pincer / claw
  const clawGeom1 = new THREE.ConeGeometry(0.1, 0.45, 6);
  clawGeom1.rotateZ(0.3);
  const clawMesh1 = new THREE.Mesh(clawGeom1, barnacleShellMat);
  clawMesh1.position.set(-0.05, -0.75, 0);
  rightArm.add(clawMesh1);

  const clawGeom2 = new THREE.ConeGeometry(0.09, 0.42, 6);
  clawGeom2.rotateZ(-0.35);
  const clawMesh2 = new THREE.Mesh(clawGeom2, barnacleShellMat);
  clawMesh2.position.set(0.08, -0.75, 0);
  rightArm.add(clawMesh2);

  body.add(rightArm);

  // Legs
  const legGeom = new THREE.CylinderGeometry(0.06, 0.05, 1.0, 8);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.15, 0, 0);
  const leftLegMesh = new THREE.Mesh(legGeom, drownedFleshMat);
  leftLegMesh.position.y = -0.5;
  leftLeg.add(leftLegMesh);
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.15, 0, 0);
  const rightLegMesh = new THREE.Mesh(legGeom, drownedFleshMat);
  rightLegMesh.position.y = -0.5;
  rightLeg.add(rightLegMesh);
  root.add(rightLeg);

  return { root, head, body, leftArm, rightArm, leftLeg, rightLeg, eyeLights };
}

/**
 * Builds Follower Types (Crawler, Shambler, Stalker, Brute)
 */
export function buildFollowerMesh(type: EnemyType): EnemyMeshRig {
  const root = new THREE.Group();
  root.name = `${type}_Rig`;

  switch (type) {
    case 'follower_crawler': {
      // Low crawling quad creature in torn white bandages
      const crawlerMat = new THREE.MeshStandardMaterial({
        map: bloodClothTex,
        color: 0xcccccc,
        roughness: 0.8,
      });
      const body = new THREE.Group();
      body.position.y = 0.45;
      root.add(body);

      // Low elongated torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.7), crawlerMat);
      torso.castShadow = true;
      body.add(torso);

      const head = new THREE.Group();
      head.position.set(0, 0.05, 0.4);
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), crawlerMat);
      head.add(headMesh);
      body.add(head);

      // Sprawled limbs
      const limbGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 6);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.25, -0.05, 0.2);
      leftArm.rotation.z = 0.7;
      leftArm.add(new THREE.Mesh(limbGeom, crawlerMat));
      body.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.25, -0.05, 0.2);
      rightArm.rotation.z = -0.7;
      rightArm.add(new THREE.Mesh(limbGeom, crawlerMat));
      body.add(rightArm);

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.25, -0.05, -0.2);
      leftLeg.rotation.z = 0.7;
      leftLeg.add(new THREE.Mesh(limbGeom, crawlerMat));
      body.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.25, -0.05, -0.2);
      rightLeg.rotation.z = -0.7;
      rightLeg.add(new THREE.Mesh(limbGeom, crawlerMat));
      body.add(rightLeg);

      return { root, head, body, leftArm, rightArm, leftLeg, rightLeg };
    }

    case 'follower_shambler': {
      // Blooded shambler follower of Maryam
      const mat = new THREE.MeshStandardMaterial({ map: bloodClothTex, color: 0xdddddd, roughness: 0.85 });
      const body = new THREE.Group();
      body.position.y = 0.95;
      root.add(body);

      body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.55, 8), mat));

      const head = new THREE.Group();
      head.position.y = 0.45;
      head.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mat));
      body.add(head);

      const armGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.7, 6);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.28, 0.15, 0);
      leftArm.add(new THREE.Mesh(armGeom, mat));
      body.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.28, 0.15, 0);
      rightArm.add(new THREE.Mesh(armGeom, mat));
      body.add(rightArm);

      const legGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.8, 6);
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.12, 0, 0);
      leftLeg.add(new THREE.Mesh(legGeom, mat));
      root.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.12, 0, 0);
      rightLeg.add(new THREE.Mesh(legGeom, mat));
      root.add(rightLeg);

      return { root, head, body, leftArm, rightArm, leftLeg, rightLeg };
    }

    case 'follower_stalker': {
      // Sarah's Shore Stalker: agile chitin hunter
      const mat = new THREE.MeshStandardMaterial({ map: barnacleTex, color: 0x4a5a5e, roughness: 0.7 });
      const body = new THREE.Group();
      body.position.y = 0.9;
      root.add(body);

      body.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.55, 0.22), mat));

      const head = new THREE.Group();
      head.position.y = 0.42;
      head.add(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 6), mat));
      body.add(head);

      const armGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.75, 6);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.28, 0.15, 0);
      leftArm.add(new THREE.Mesh(armGeom, mat));
      body.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.28, 0.15, 0);
      rightArm.add(new THREE.Mesh(armGeom, mat));
      body.add(rightArm);

      const legGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.8, 6);
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.12, 0, 0);
      leftLeg.add(new THREE.Mesh(legGeom, mat));
      root.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.12, 0, 0);
      rightLeg.add(new THREE.Mesh(legGeom, mat));
      root.add(rightLeg);

      return { root, head, body, leftArm, rightArm, leftLeg, rightLeg };
    }

    case 'follower_brute':
    default: {
      // Sunken Heavy brute: hulking armored creature
      const mat = new THREE.MeshStandardMaterial({ map: barnacleTex, color: 0x333b40, roughness: 0.95 });
      const body = new THREE.Group();
      body.position.y = 1.1;
      root.add(body);

      // Bulky torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.45), mat);
      body.add(torso);

      const head = new THREE.Group();
      head.position.set(0, 0.45, 0.1);
      head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat));
      body.add(head);

      const heavyArmGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.85, 8);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.45, 0.2, 0);
      leftArm.add(new THREE.Mesh(heavyArmGeom, mat));
      body.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.45, 0.2, 0);
      rightArm.add(new THREE.Mesh(heavyArmGeom, mat));
      body.add(rightArm);

      const heavyLegGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8);
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.2, 0, 0);
      leftLeg.add(new THREE.Mesh(heavyLegGeom, mat));
      root.add(leftLeg);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.2, 0, 0);
      rightLeg.add(new THREE.Mesh(heavyLegGeom, mat));
      root.add(rightLeg);

      return { root, head, body, leftArm, rightArm, leftLeg, rightLeg };
    }
  }
}

/**
 * Builds First-Person Weapon 3D Viewmodels
 */
export function buildWeaponViewModel(id: WeaponId): THREE.Group {
  const group = new THREE.Group();
  group.name = `ViewModel_${id}`;

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222629,
    roughness: 0.35,
    metalness: 0.85,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.8,
    metalness: 0.1,
  });

  switch (id) {
    case 'pistol': {
      // Semi-auto 9mm pistol
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.32), gunMetalMat);
      slide.position.set(0, 0.06, -0.06);
      group.add(slide);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.18, 0.1), gripMat);
      grip.position.set(0, -0.06, 0.05);
      grip.rotation.x = -0.25;
      group.add(grip);
      break;
    }

    case 'shotgun': {
      // Tactical pump action shotgun
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.42), gunMetalMat);
      group.add(receiver);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 12), gunMetalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.45);
      group.add(barrel);

      const magazineTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12), gunMetalMat);
      magazineTube.rotation.x = Math.PI / 2;
      magazineTube.position.set(0, -0.02, -0.4);
      group.add(magazineTube);

      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12), gripMat);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0, -0.02, -0.32);
      group.add(pump);
      break;
    }

    case 'rifle': {
      // Assault rifle
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.5), gunMetalMat);
      group.add(receiver);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10), gunMetalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.48);
      group.add(barrel);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.24, 0.12), gunMetalMat);
      mag.position.set(0, -0.15, -0.05);
      mag.rotation.x = 0.25;
      group.add(mag);
      break;
    }

    case 'heavy': {
      // Heavy rocket / demolition cannon
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.8, 16), gunMetalMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0, -0.2);
      group.add(tube);
      break;
    }

    case 'laser': {
      // Prism Arc Laser gun with glowing energy cell
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.45), gunMetalMat);
      group.add(chassis);

      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.2, 12), gunMetalMat);
      emitter.rotation.x = Math.PI / 2;
      emitter.position.set(0, 0, -0.3);
      group.add(emitter);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.18, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      core.rotation.x = Math.PI / 2;
      core.position.set(0, 0.03, -0.05);
      group.add(core);
      break;
    }

    case 'electric':
    case 'taser': {
      // Tesla Arc weapon with lightning coils
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.38), gunMetalMat);
      group.add(body);

      const coilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 16), coilMat);
        coil.position.set(0, 0.02, -0.1 - i * 0.08);
        group.add(coil);
      }
      break;
    }

    default: {
      const generic = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.35), gunMetalMat);
      group.add(generic);
    }
  }

  // Positioning relative to player camera (lower right)
  group.position.set(0.24, -0.22, -0.45);
  return group;
}
