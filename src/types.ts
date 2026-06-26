export enum GameState {
  START = 'START',
  PREDEPLOYMENT = 'PREDEPLOYMENT',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  PAUSED = 'PAUSED',
}

export enum Lane {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

export enum WeaponType {
  PLASMA_RIFT = 'PLASMA_RIFT',
  SCATTER_CANNON = 'SCATTER_CANNON',
  SONIC_PULSE = 'SONIC_PULSE',
}

export enum ObstacleType {
  BARRIER_HIGH = 'BARRIER_HIGH',   // Must slide under
  BARRIER_LOW = 'BARRIER_LOW',     // Must jump over
  SPIKE_ROCK = 'SPIKE_ROCK',       // Collision obstacle
  ENERGY_GATE = 'ENERGY_GATE',     // Core power cell to smash/collect
  RIFT_CHARGER = 'RIFT_CHARGER',   // Speed boost / multiplier node
  GATE_PILLAR = 'GATE_PILLAR',     // Moving gate pillar that drops or rises
  DRONE = 'DRONE',                 // Flying drone that crosses lanes horizontally
  SHIELD_POWERUP = 'SHIELD_POWERUP', // Protection Shield power-up
  MAGNET = 'MAGNET',               // Magnet power-up
}

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  lane: Lane;
  zPosition: number;
}

export interface ScoreEntry {
  id?: string;
  created_at?: string;
  username: string;
  score: number;
  distance: number;
  duration_seconds: number;
  character_class: string;
}

export interface PlayerState {
  lane: Lane;
  targetX: number;
  currentX: number;
  y: number;
  isJumping: boolean;
  isSliding: boolean;
  jumpTime: number;
  slideTime: number;
  health: number;
  energy: number; // For firing or active shield
  score: number;
  distance: number;
  coins: number;
  speed: number;
  magnetTime?: number;
  hasShield?: boolean;
  comboCount?: number;
  comboMultiplier?: number;
  comboMessage?: string;
  comboMessageTime?: number;
  currentWeapon?: WeaponType;
  weaponAmmo?: Record<WeaponType, number>;
  weaponCooldown?: Record<WeaponType, number>; // Current cooldown frames
  autoFireEnabled?: boolean;
}
