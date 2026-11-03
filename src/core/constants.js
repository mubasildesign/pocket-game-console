export const SCREEN = { W: 300, H: 540 };

export const GRID = {
  COLS: 10,
  ROWS: 20,
  CELL: 24,
  X: 30,
  Y: 48,
};

export const PLAY = { x: 8, y: 52, w: 284, h: 476 };

export const PALETTE = {
  lcdBg: '#a9ba9b',
  lcdWell: '#9aab8c',
  lcdDim: '#8b9d7e',
  lcdOn: '#1c2718',
  lcdGhost: '#5d6d52',
  hud: '#1c2718',
  glassTop: '#121a28',
  glassBot: '#070b12',
  cyan: '#3ee0ff',
  magenta: '#ff4d8d',
  amber: '#ffd15a',
  lime: '#c6ff4a',
  white: '#f4f7ff',
  ink: '#071018',
};

export const SPECTACLE = {
  BURST_MAX: 16,
  BURST_COUNT: 12,
  SHAKE_GLASS: 6,
  SHAKE_LCD: 2.5,
  SLAM_AT: [5, 10, 25, 50],
  SLAM_LABELS: { 5: 'LOCKED IN', 10: 'UNSTOPPABLE', 25: 'LEGENDARY', 50: 'MYTHIC' },
  HINT_SECONDS: 2.4,
};

export const TUNING = {
  stack: { gravity: 0.72, soft: 0.05, repeat: 0.14, rate: 0.05, clear: 0.12, linesPerLevel: 10 },
  race: { tick: 0.22, minTick: 0.08, spawn: 1.05 },
  snake: { tick: 0.2, minTick: 0.08 },
  blaster: { step: 0.12, fire: 0.28, fall: 0.34, minFall: 0.14 },
  sub: { step: 0.1, shot: 0.06, enemy: 0.16, fire: 0.28 },
  tank: { step: 0.12, shell: 0.07, enemy: 0.32, shoot: 2.2 },
  frog: { hop: 0.12 },
  bird: { gravity: 460, flap: -220, gap: 140, speed: 120 },
  brick: { speed: 150 },
  maze: { step: 0.11, chase: 0.34 },
  jump: { gravity: 760, flap: -340, speed: 110 },
  climb: { step: 0.11, patrol: 0.26 },
};

export const MOTIF = {};
