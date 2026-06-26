export enum GameState {
  LOUNGE = 'LOUNGE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1
}

export enum ObstacleType {
  WALL = 'WALL',
  SPIKE_ROCK = 'SPIKE_ROCK',
  DRONE = 'DRONE',
  LOW_BARRIER = 'LOW_BARRIER'
}

export enum WeaponType {
  BLASTER = 'BLASTER',
  PLASMA_BLADE = 'PLASMA_BLADE',
  NONE = 'NONE'
}

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  lane: Lane;
  zPosition: number;
  hasBeenPassed: boolean;
}

export interface CollectibleData {
  id: string;
  type: 'COIN' | 'ENERGY_CELL' | 'SHIELD_POWERUP' | 'MAGNET_POWERUP';
  lane: Lane;
  zPosition: number;
  hasBeenCollected: boolean;
}

export interface PlayerState {
  distance: number;
  speed: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  shieldActive: boolean;
  shieldRemaining: number;
  score: number;
  coins: number;
  multiplier: number;
  currentLane: Lane;
  targetLaneX: number;
  xPosition: number;
  isJumping: boolean;
  isSliding: boolean;
}
