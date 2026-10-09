export type WeaponId = 
  | 'pistol' 
  | 'shotgun' 
  | 'rifle' 
  | 'heavy' 
  | 'laser' 
  | 'electric' 
  | 'taser' 
  | 'shock' 
  | 'energy';

export interface WeaponData {
  id: WeaponId;
  name: string;
  nameAr: string;
  category: 'conventional' | 'special';
  damage: number;
  fireRate: number; // rounds per second
  clipSize: number;
  currentClip: number;
  reserveAmmo: number;
  maxReserve: number;
  reloadTime: number; // seconds
  range: number;
  spread: number;
  pellets?: number;
  isUnlocked: boolean;
  upgradeTier: number; // 0, 1, 2
  cost: number;
  description: string;
}

export type EnemyType = 
  | 'boss_maryam' 
  | 'boss_sarah' 
  | 'follower_crawler' 
  | 'follower_shambler' 
  | 'follower_stalker' 
  | 'follower_brute';

export type AIState = 
  | 'PATROL' 
  | 'INVESTIGATE' 
  | 'CHASE' 
  | 'ATTACK' 
  | 'STUNNED' 
  | 'DEAD';

export interface EnemyInstance {
  id: string;
  type: EnemyType;
  name: string;
  nameAr: string;
  health: number;
  maxHealth: number;
  speed: number;
  runSpeed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  aiState: AIState;
  position: { x: number; y: number; z: number };
  rotation: number; // yaw
  velocity: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number } | null;
  lastKnownPlayerPos: { x: number; y: number; z: number } | null;
  patrolWaypoints: { x: number; z: number }[];
  currentWaypointIndex: number;
  searchTimer: number;
  stunTimer: number;
  isBoss: boolean;
  bossPhase: number;
  detectionRange: number;
  hearingRange: number;
  hitReactionTimer: number;
  dropCoins: number;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  battery: number;
  maxBattery: number;
  fear: number;
  maxFear: number;
  fearCause?: 'darkness' | 'monster' | 'critical' | 'none';
  flashlightOn: boolean;
  coins: number;
  weapons: Record<WeaponId, WeaponData>;
  currentWeaponId: WeaponId;
  inventory: {
    keycards: string[]; // e.g. 'lab_key', 'quarantine_key'
    medkits: number;
  };
  objective: string;
  objectiveAr: string;
  isSprinting: boolean;
  isCrouching: boolean;
  isGrounded: boolean;
}

export interface GameSettings {
  language: 'en' | 'ar';
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  musicVolume: number;
  muted: boolean;
  sensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  reducedFlashing: boolean;
  filmGrainEnabled?: boolean;
}

export interface LevelItem {
  id: string;
  type: 'ammo_pistol' | 'ammo_shotgun' | 'ammo_rifle' | 'medkit' | 'coin' | 'keycard' | 'battery';
  name: string;
  position: { x: number; y: number; z: number };
  value?: number;
  keyId?: string;
  collected: boolean;
}

export interface InteractiveDoor {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  isOpen: boolean;
  isLocked: boolean;
  requiredKey?: string;
  name: string;
  openProgress: number; // 0 to 1
}
