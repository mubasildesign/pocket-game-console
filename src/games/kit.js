import { GRID } from '../core/constants.js';

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function rand(n) {
  return Math.floor(Math.random() * n);
}

export function pick(list) {
  return list[rand(list.length)];
}

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pad(n, len) {
  const s = String(Math.max(0, n | 0));
  return s.length >= len ? s.slice(-len) : '0'.repeat(len - s.length) + s;
}

export function makeGrid(cols, rows, fill = 0) {
  const cells = Array.from({ length: rows }, () => Array(cols).fill(fill));
  return {
    cols,
    rows,
    cells,
    in(x, y) {
      return x >= 0 && y >= 0 && x < cols && y < rows;
    },
    get(x, y) {
      if (!this.in(x, y)) return 1;
      return cells[y][x];
    },
    set(x, y, v) {
      if (this.in(x, y)) cells[y][x] = v;
    },
  };
}

export function cellBox(x, y) {
  return {
    x: GRID.X + x * GRID.CELL,
    y: GRID.Y + y * GRID.CELL,
    w: GRID.CELL,
    h: GRID.CELL,
  };
}

export function dirHeld(input, neg, pos) {
  const n = input.held(neg) || input.pressed(neg);
  const p = input.held(pos) || input.pressed(pos);
  if (n === p) return 0;
  return n ? -1 : 1;
}

export function createAutoRepeat(initial = 0.18, rate = 0.055) {
  let last = 0;
  let cool = 0;
  return function step(dt, dir, onStep) {
    if (!dir) {
      last = 0;
      cool = 0;
      return;
    }
    if (dir !== last) {
      last = dir;
      cool = initial;
      onStep(dir);
      return;
    }
    cool -= dt;
    if (cool <= 0) {
      cool = rate;
      onStep(dir);
    }
  };
}

export function createIFrames(seconds = 1.15) {
  let t = 0;
  return {
    trigger() {
      t = seconds;
    },
    tick(dt) {
      t = Math.max(0, t - dt);
    },
    on() {
      return t > 0;
    },
    visible() {
      return t <= 0 || Math.floor(t * 14) % 2 === 0;
    },
  };
}

export function bestKey(id) {
  return `pocket-grid:${id}`;
}

export function readBest(id) {
  try {
    return Number(localStorage.getItem(bestKey(id))) || 0;
  } catch {
    return 0;
  }
}

export function writeBest(id, score) {
  const best = Math.max(readBest(id), score | 0);
  try {
    localStorage.setItem(bestKey(id), String(best));
  } catch {
    /* private mode */
  }
  return best;
}

export const DIRS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
