import * as THREE from 'three';
import { EnemyInstance, AIState } from './types';
import { horrorAudio } from './audio';

/**
 * 2D Grid Pathfinding and AI Navigation System for SHADOWS: NIGHT TIDE
 * Features:
 * - A* Grid Pathfinding across facility corridors, rooms, and doorways
 * - Obstacle Avoidance Steering (whisker raycasts around corners and pillars)
 * - Detection & Line of Sight (Raycasting against walls)
 * - Last Known Position (LKP) Tracking and Area Investigation
 */

export interface NavObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class NavigationSystem {
  public gridSize: number = 1.0;
  public gridWidth: number = 80;
  public gridDepth: number = 80;
  public originX: number = -40;
  public originZ: number = -40;

  // Grid occupancy: false = walkable, true = blocked
  private grid: boolean[][] = [];
  private obstacles: NavObstacle[] = [];

  constructor() {
    this.initGrid();
  }

  private initGrid() {
    const cols = Math.ceil(this.gridWidth / this.gridSize);
    const rows = Math.ceil(this.gridDepth / this.gridSize);
    this.grid = [];
    for (let x = 0; x < cols; x++) {
      this.grid[x] = new Array(rows).fill(false);
    }
  }

  public setObstacles(obs: NavObstacle[]) {
    this.obstacles = obs;
    this.initGrid();

    // Mark obstacle cells
    obs.forEach((o) => {
      const minCol = Math.max(0, Math.floor((o.minX - this.originX) / this.gridSize));
      const maxCol = Math.min(this.grid.length - 1, Math.ceil((o.maxX - this.originX) / this.gridSize));
      const minRow = Math.max(0, Math.floor((o.minZ - this.originZ) / this.gridSize));
      const maxRow = Math.min(this.grid[0].length - 1, Math.ceil((o.maxZ - this.originZ) / this.gridSize));

      for (let c = minCol; c <= maxCol; c++) {
        for (let r = minRow; r <= maxRow; r++) {
          this.grid[c][r] = true;
        }
      }
    });
  }

  public isWalkable(x: number, z: number): boolean {
    const c = Math.floor((x - this.originX) / this.gridSize);
    const r = Math.floor((z - this.originZ) / this.gridSize);
    if (c < 0 || c >= this.grid.length || r < 0 || r >= this.grid[0].length) {
      return false;
    }
    return !this.grid[c][r];
  }

  /**
   * Line of sight test between two points. Returns true if clear path exists.
   */
  public hasLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
    const dist = Math.hypot(x2 - x1, z2 - z1);
    const steps = Math.ceil(dist / 0.5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const testX = x1 + (x2 - x1) * t;
      const testZ = z1 + (z2 - z1) * t;
      if (!this.isWalkable(testX, testZ)) {
        return false;
      }
    }
    return true;
  }

  /**
   * A* Pathfinding to compute series of waypoints from start to target.
   */
  public findPath(startX: number, startZ: number, targetX: number, targetZ: number): { x: number; z: number }[] {
    const startCol = Math.max(0, Math.min(this.grid.length - 1, Math.floor((startX - this.originX) / this.gridSize)));
    const startRow = Math.max(0, Math.min(this.grid[0].length - 1, Math.floor((startZ - this.originZ) / this.gridSize)));
    const targetCol = Math.max(0, Math.min(this.grid.length - 1, Math.floor((targetX - this.originX) / this.gridSize)));
    const targetRow = Math.max(0, Math.min(this.grid[0].length - 1, Math.floor((targetZ - this.originZ) / this.gridSize)));

    if (startCol === targetCol && startRow === targetRow) {
      return [{ x: targetX, z: targetZ }];
    }

    interface Node {
      c: number;
      r: number;
      g: number;
      h: number;
      f: number;
      parent?: Node;
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();
    const estimateRemainingCost = (col: number, row: number) => {
      const dx = Math.abs(targetCol - col);
      const dz = Math.abs(targetRow - row);
      return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
    };

    const startNode: Node = {
      c: startCol,
      r: startRow,
      g: 0,
      h: estimateRemainingCost(startCol, startRow),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    const neighbors = [
      { dc: 1, dr: 0 },
      { dc: -1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: 0, dr: -1 },
      { dc: 1, dr: 1 },
      { dc: -1, dr: 1 },
      { dc: 1, dr: -1 },
      { dc: -1, dr: -1 },
    ];

    let iterations = 0;
    while (openList.length > 0 && iterations < 350) {
      iterations++;
      // Get lowest f
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];
      const key = `${current.c},${current.r}`;

      if (current.c === targetCol && current.r === targetRow) {
        // Reconstruct path
        const path: { x: number; z: number }[] = [];
        let curr: Node | undefined = current;
        while (curr) {
          path.unshift({
            x: this.originX + curr.c * this.gridSize + this.gridSize / 2,
            z: this.originZ + curr.r * this.gridSize + this.gridSize / 2,
          });
          curr = curr.parent;
        }
        // Replace last node with exact target coordinates
        if (path.length > 0) {
          path[path.length - 1] = { x: targetX, z: targetZ };
        }
        return path;
      }

      closedSet.add(key);

      for (const n of neighbors) {
        const nextC = current.c + n.dc;
        const nextR = current.r + n.dr;
        const neighborKey = `${nextC},${nextR}`;

        if (nextC < 0 || nextC >= this.grid.length || nextR < 0 || nextR >= this.grid[0].length) continue;
        if (this.grid[nextC][nextR]) continue;
        if (closedSet.has(neighborKey)) continue;

        // Diagonal corner cutting check
        if (n.dc !== 0 && n.dr !== 0) {
          if (this.grid[current.c + n.dc][current.r] || this.grid[current.c][current.r + n.dr]) {
            continue;
          }
        }

        const moveCost = (n.dc !== 0 && n.dr !== 0) ? 1.414 : 1.0;
        const gScore = current.g + moveCost;

        let existing = openList.find((node) => node.c === nextC && node.r === nextR);
        if (!existing) {
          const h = estimateRemainingCost(nextC, nextR);
          existing = {
            c: nextC,
            r: nextR,
            g: gScore,
            h: h,
            f: gScore + h,
            parent: current,
          };
          openList.push(existing);
        } else if (gScore < existing.g) {
          existing.g = gScore;
          existing.f = gScore + existing.h;
          existing.parent = current;
        }
      }
    }

    // Fallback: direct target
    return [{ x: targetX, z: targetZ }];
  }

  /**
   * Steering obstacle avoidance: Whisker raycast steering to glide around tight corners
   */
  public calculateSteeringAvoidance(
    posX: number,
    posZ: number,
    dirX: number,
    dirZ: number,
    lookAhead: number = 1.2
  ): { steerX: number; steerZ: number } {
    let steerX = 0;
    let steerZ = 0;

    // Whisker angles: center, left 40deg, right 40deg
    const angles = [0, 0.7, -0.7];
    const distances = [lookAhead, lookAhead * 0.85, lookAhead * 0.85];

    for (let i = 0; i < angles.length; i++) {
      const angle = angles[i];
      const dist = distances[i];

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rayX = dirX * cos - dirZ * sin;
      const rayZ = dirX * sin + dirZ * cos;

      const checkX = posX + rayX * dist;
      const checkZ = posZ + rayZ * dist;

      if (!this.isWalkable(checkX, checkZ)) {
        // Push in opposite perpendicular direction
        steerX -= rayZ * (i === 1 ? -1 : 1) * 0.7;
        steerZ += rayX * (i === 1 ? -1 : 1) * 0.7;
      }
    }

    return { steerX, steerZ };
  }
}

export const navSystem = new NavigationSystem();

/**
 * Updates Enemy AI state machine, navigation, and detection
 */
export function updateEnemyAI(
  enemy: EnemyInstance,
  playerPos: { x: number; y: number; z: number },
  playerNoiseFactor: number, // 0 = crouch, 1 = walk, 2 = sprint, 3 = gunfire
  deltaTime: number,
  onAttackPlayer: (damage: number) => void
) {
  if (enemy.health <= 0) {
    enemy.aiState = 'DEAD';
    return;
  }

  if (enemy.stunTimer > 0) {
    enemy.stunTimer = Math.max(0, enemy.stunTimer - deltaTime);
    enemy.aiState = 'STUNNED';
    if (enemy.stunTimer > 0) return;
  }

  // A stun state must transition back into the AI state machine once its
  // timer expires; otherwise the enemy remains inert forever.
  if (enemy.aiState === 'STUNNED') {
    enemy.aiState = enemy.lastKnownPlayerPos ? 'CHASE' : 'PATROL';
  }

  const dx = playerPos.x - enemy.position.x;
  const dz = playerPos.z - enemy.position.z;
  const distanceToPlayer = Math.hypot(dx, dz);

  // Boss Phase Transition Check (<50% Health)
  if (enemy.isBoss && enemy.health < enemy.maxHealth * 0.5 && enemy.bossPhase === 1) {
    enemy.bossPhase = 2;
    if (enemy.type === 'boss_maryam') {
      horrorAudio.playMaryamScream();
      enemy.speed *= 1.3;
      enemy.runSpeed *= 1.35;
      enemy.attackCooldown = Math.max(0.7, enemy.attackCooldown * 0.7);
      enemy.damage = Math.round(enemy.damage * 1.3);
    } else if (enemy.type === 'boss_sarah') {
      horrorAudio.playSarahShriek();
      enemy.speed *= 1.35;
      enemy.runSpeed *= 1.4;
      enemy.attackCooldown = Math.max(0.65, enemy.attackCooldown * 0.65);
      enemy.damage = Math.round(enemy.damage * 1.25);
    }
  }

  // Vision cone check
  const enemyFacing = new THREE.Vector2(-Math.sin(enemy.rotation), -Math.cos(enemy.rotation));
  const toPlayerDir = new THREE.Vector2(dx, dz).normalize();
  const dot = enemyFacing.dot(toPlayerDir); // 1 = directly ahead, -1 = behind

  const inVisionCone = dot > 0.15 || distanceToPlayer < 3.2; // 360 awareness within 3.2m
  const effectiveDetectionRange = enemy.detectionRange * (1 + playerNoiseFactor * 0.35);
  const canSeePlayer = distanceToPlayer <= effectiveDetectionRange && inVisionCone && navSystem.hasLineOfSight(enemy.position.x, enemy.position.z, playerPos.x, playerPos.z);

  // Hearing check (player sprinting or shooting nearby)
  const canHearPlayer = distanceToPlayer <= enemy.hearingRange * (playerNoiseFactor >= 1.5 ? 1.5 : 0.6);

  // ---------------- AI STATE MACHINE ----------------
  switch (enemy.aiState) {
    case 'PATROL': {
      if (canSeePlayer) {
        // Spotted player directly!
        enemy.aiState = 'CHASE';
        enemy.lastKnownPlayerPos = { ...playerPos };
        if (enemy.isBoss) {
          if (enemy.type === 'boss_maryam') horrorAudio.playMaryamScream();
          else horrorAudio.playSarahShriek();
          horrorAudio.setChaseMusic(true);
        } else {
          horrorAudio.playFollowerSnarl();
        }
      } else if (canHearPlayer) {
        // Heard noise -> investigate noise location!
        enemy.aiState = 'INVESTIGATE';
        enemy.lastKnownPlayerPos = { ...playerPos };
        enemy.searchTimer = 5.0;
      } else {
        // Patrol waypoint logic
        if (enemy.patrolWaypoints.length > 0) {
          const wp = enemy.patrolWaypoints[enemy.currentWaypointIndex];
          const distToWp = Math.hypot(wp.x - enemy.position.x, wp.z - enemy.position.z);
          if (distToWp < 1.0) {
            enemy.currentWaypointIndex = (enemy.currentWaypointIndex + 1) % enemy.patrolWaypoints.length;
          }
          moveEnemyToward(enemy, wp.x, wp.z, enemy.speed, deltaTime);
        }
      }
      break;
    }

    case 'CHASE': {
      if (canSeePlayer) {
        // Keep updating last known position while line of sight is held
        enemy.lastKnownPlayerPos = { ...playerPos };

        // Check if within strike range
        if (distanceToPlayer <= enemy.attackRange) {
          enemy.aiState = 'ATTACK';
        } else {
          // Pursue player with runSpeed
          const currentSpeed = enemy.runSpeed * (enemy.bossPhase === 2 ? 1.25 : 1.0);
          moveEnemyToward(enemy, playerPos.x, playerPos.z, currentSpeed, deltaTime);
        }
      } else {
        // LOST LINE OF SIGHT! Transition to INVESTIGATE last known position
        enemy.aiState = 'INVESTIGATE';
        enemy.searchTimer = 6.0;
        if (enemy.type === 'boss_maryam') horrorAudio.playMaryamGroan();
        else if (enemy.type === 'boss_sarah') horrorAudio.playSarahClicking();
      }
      break;
    }

    case 'INVESTIGATE': {
      if (canSeePlayer) {
        // Player re-acquired!
        enemy.aiState = 'CHASE';
        enemy.lastKnownPlayerPos = { ...playerPos };
      } else if (enemy.lastKnownPlayerPos) {
        const distToLKP = Math.hypot(
          enemy.lastKnownPlayerPos.x - enemy.position.x,
          enemy.lastKnownPlayerPos.z - enemy.position.z
        );

        if (distToLKP > 1.2) {
          // Move towards player's last known position using pathfinding
          moveEnemyToward(enemy, enemy.lastKnownPlayerPos.x, enemy.lastKnownPlayerPos.z, enemy.speed * 1.1, deltaTime);
        } else {
          // Arrived at LKP: search the area with head turns
          enemy.searchTimer -= deltaTime;
          enemy.rotation += Math.sin(enemy.searchTimer * 2) * deltaTime * 1.5;

          if (enemy.searchTimer <= 0) {
            // Did not find player; resume patrol
            enemy.aiState = 'PATROL';
            enemy.lastKnownPlayerPos = null;
            if (enemy.isBoss) {
              horrorAudio.setChaseMusic(false);
            }
          }
        }
      } else {
        enemy.aiState = 'PATROL';
      }
      break;
    }

    case 'ATTACK': {
      // Face player
      enemy.rotation = Math.atan2(dx, dz) + Math.PI;

      const now = performance.now() / 1000;
      if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
        enemy.lastAttackTime = now;
        onAttackPlayer(enemy.damage);

        if (enemy.type === 'boss_maryam') {
          horrorAudio.playMaryamScream();
        } else if (enemy.type === 'boss_sarah') {
          horrorAudio.playSarahShriek();
        } else {
          horrorAudio.playFollowerSnarl();
        }
      }

      // If player backed away, resume chase
      if (distanceToPlayer > enemy.attackRange * 1.3) {
        enemy.aiState = 'CHASE';
      }
      break;
    }

    case 'DEAD':
      break;
  }
}

/**
 * Moves enemy toward target with obstacle avoidance and collision sliding
 */
function moveEnemyToward(enemy: EnemyInstance, targetX: number, targetZ: number, speed: number, dt: number) {
  const dirX = targetX - enemy.position.x;
  const dirZ = targetZ - enemy.position.z;
  const len = Math.hypot(dirX, dirZ);
  if (len < 0.05) return;

  const normX = dirX / len;
  const normZ = dirZ / len;

  // Steering obstacle avoidance
  const { steerX, steerZ } = navSystem.calculateSteeringAvoidance(enemy.position.x, enemy.position.z, normX, normZ, 1.2);

  const finalDirX = normX + steerX;
  const finalDirZ = normZ + steerZ;
  const finalLen = Math.hypot(finalDirX, finalDirZ);

  if (finalLen > 0.01) {
    const moveX = (finalDirX / finalLen) * speed * dt;
    const moveZ = (finalDirZ / finalLen) * speed * dt;

    const nextX = enemy.position.x + moveX;
    const nextZ = enemy.position.z + moveZ;

    // Check map boundaries & walls
    if (navSystem.isWalkable(nextX, enemy.position.z)) {
      enemy.position.x = nextX;
    }
    if (navSystem.isWalkable(enemy.position.x, nextZ)) {
      enemy.position.z = nextZ;
    }

    // Smoothly rotate toward movement direction
    const targetAngle = Math.atan2(-finalDirX, -finalDirZ);
    enemy.rotation = targetAngle;
  }
}
