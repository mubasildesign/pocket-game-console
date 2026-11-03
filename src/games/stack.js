import { TUNING } from '../core/constants.js';
import { createAutoRepeat, dirHeld, makeGrid } from './kit.js';

const ROTS = [
  [ [[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]], [[0, 2], [1, 2], [2, 2], [3, 2]], [[1, 0], [1, 1], [1, 2], [1, 3]] ],
  [ [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [2, 1]] ],
  [ [[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]] ],
  [ [[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]] ],
  [ [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]] ],
  [ [[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]], [[1, 1], [2, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [1, 1], [1, 2]] ],
  [ [[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [1, 2], [2, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]] ],
];

const SCORES = [0, 100, 300, 500, 800];

export const stack = {
  id: 'stack',
  title: 'STACK',
  blurb: 'DROP AND CLEAR LINES',
  era: 'lcd',
  layout: 'grid',
  lives: 1,
  create(session) {
    const board = makeGrid(10, 20, 0);
    const repeat = createAutoRepeat(TUNING.stack.repeat, TUNING.stack.rate);
    let type = 0;
    let rot = 0;
    let x = 3;
    let y = 0;
    let drop = 0;
    let lines = 0;
    let clearing = null;
    const bag = [];

    function pull() {
      if (!bag.length) {
        const next = [0, 1, 2, 3, 4, 5, 6];
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        bag.push(...next);
      }
      return bag.pop();
    }

    function cells(px, py, r, t = type) {
      return ROTS[t][r].map(([cx, cy]) => [px + cx, py + cy]);
    }

    function fits(px, py, r, t = type) {
      for (const [cx, cy] of cells(px, py, r, t)) {
        if (cx < 0 || cx >= 10 || cy >= 20) return false;
        if (cy >= 0 && board.get(cx, cy)) return false;
      }
      return true;
    }

    function spawn() {
      type = pull();
      rot = 0;
      x = 3;
      y = 0;
      if (!fits(x, y, rot)) session.loseLife();
    }

    function lock() {
      for (const [cx, cy] of cells(x, y, rot)) {
        if (cy < 0) {
          session.loseLife();
          return;
        }
        board.set(cx, cy, 1);
      }
      session.sfx('lock');
      const full = [];
      for (let row = 0; row < 20; row++) {
        let packed = true;
        for (let col = 0; col < 10; col++) if (!board.cells[row][col]) packed = false;
        if (packed) full.push(row);
      }
      if (full.length) {
        clearing = { rows: full, t: TUNING.stack.clear };
        session.sfx('clear');
      } else {
        spawn();
      }
    }

    function finishClear() {
      const doomed = new Set(clearing.rows);
      for (let row = 19; row >= 0; row--) {
        if (doomed.has(row)) board.cells.splice(row, 1);
      }
      while (board.cells.length < 20) board.cells.unshift(Array(10).fill(0));
      const gained = SCORES[clearing.rows.length] * session.level;
      session.addScore(gained);
      lines += clearing.rows.length;
      const nextLevel = 1 + Math.floor(lines / TUNING.stack.linesPerLevel);
      if (nextLevel > session.level) session.setLevel(nextLevel);
      clearing = null;
      spawn();
    }

    spawn();

    return {
      update(dt, input) {
        if (session.dead) return;
        if (clearing) {
          clearing.t -= dt;
          if (clearing.t <= 0) finishClear();
          return;
        }
        repeat(dt, dirHeld(input, 'left', 'right'), (dir) => {
          if (fits(x + dir, y, rot)) {
            x += dir;
            session.sfx('move');
          }
        });
        if (input.pressed('rotate')) {
          const nr = (rot + 1) % 4;
          const kicks = [0, -1, 1, -2, 2];
          for (const kick of kicks) {
            if (fits(x + kick, y, nr)) {
              x += kick;
              rot = nr;
              session.sfx('rotate');
              break;
            }
          }
        }
        if (input.pressed('up')) {
          while (fits(x, y + 1, rot)) y += 1;
          lock();
          return;
        }
        const grav = Math.max(0.12, TUNING.stack.gravity * (0.88 ** (session.level - 1)));
        drop += dt;
        const step = input.held('down') ? TUNING.stack.soft : grav;
        if (drop >= step) {
          drop = 0;
          if (fits(x, y + 1, rot)) y += 1;
          else lock();
        }
      },
      draw(gfx) {
        const blinkOff = clearing && Math.floor(clearing.t * 20) % 2 === 0;
        for (let row = 0; row < 20; row++) {
          if (blinkOff && clearing.rows.includes(row)) continue;
          for (let col = 0; col < 10; col++) if (board.cells[row][col]) gfx.plot(col, row, true);
        }
        if (!clearing && !session.dead) {
          for (const [cx, cy] of cells(x, y, rot)) gfx.plot(cx, cy, true);
        }
      },
    };
  },
};
