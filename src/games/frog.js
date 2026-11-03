import { TUNING } from '../core/constants.js';
import { createIFrames } from './kit.js';

function pattern(y, kind, dir, speed, len, gap) {
  const items = [];
  let x = (y * 3) % 10;
  for (let i = 0; i < 3; i++) {
    items.push({ x, len });
    x += len + gap;
  }
  return { y, kind, dir, speed, len, items };
}

function makeRows(level) {
  const boost = 1 + (level - 1) * 0.12;
  return [
    pattern(2, 'log', 1, 10 * boost, 4, 5),
    pattern(4, 'log', -1, 12 * boost, 4, 5),
    pattern(6, 'log', 1, 9 * boost, 5, 5),
    pattern(9, 'car', -1, 12 * boost, 2, 6),
    pattern(11, 'car', 1, 14 * boost, 2, 6),
    pattern(13, 'car', -1, 11 * boost, 2, 6),
    pattern(15, 'car', 1, 13 * boost, 2, 6),
    pattern(17, 'car', -1, 12 * boost, 2, 6),
  ];
}

const RIVER = new Set([2, 4, 6]);
const ROAD = new Set([9, 11, 13, 15, 17]);

export const frog = {
  id: 'frog',
  title: 'FROG',
  blurb: 'CROSS TO THE BANK',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let x = 4;
    let y = 19;
    let rows = makeRows(1);
    let hop = 0;
    let homes = 0;
    const iframes = createIFrames(0.8);

    function resetSpot() {
      x = 4;
      y = 19;
    }

    function onItem(fx, item) {
      return fx + 0.2 >= item.x && fx <= item.x + item.len - 0.8;
    }

    function hopTo(nx, ny) {
      if (nx < 0 || nx > 9 || ny < 0 || ny > 19) return;
      x = nx;
      y = ny;
      session.sfx('move');
      if (y === 0) {
        homes += 1;
        session.addScore(100);
        session.sfx('clear');
        if (homes % 6 === 0) session.setLevel(session.level + 1);
        rows = makeRows(session.level);
        resetSpot();
      }
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        hop -= dt;
        if (hop <= 0) {
          let moved = false;
          if (input.pressed('up')) {
            hopTo(x, y - 1);
            moved = true;
          } else if (input.pressed('down')) hopTo(x, y + 1), moved = true;
          else if (input.pressed('left')) hopTo(x - 1, y), moved = true;
          else if (input.pressed('right')) hopTo(x + 1, y), moved = true;
          if (moved) hop = TUNING.frog.hop;
        }
        for (const row of rows) {
          const delta = row.dir * row.speed * dt * 0.06;
          if (RIVER.has(row.y) && y === row.y) {
            const on = row.items.some((item) => onItem(x, item));
            if (on) x += delta;
          }
          for (const item of row.items) {
            item.x += delta;
            const span = 10 + item.len + 2;
            if (item.x > 12) item.x -= span;
            if (item.x < -item.len - 2) item.x += span;
          }
        }
        if (x < -0.2 || x > 9.2) {
          if (!iframes.on()) {
            session.loseLife('crash');
            iframes.trigger();
            if (!session.dead) resetSpot();
          }
        }
        for (const row of rows) {
          if (row.y !== y) continue;
          const on = row.items.some((item) => onItem(x, item));
          if (ROAD.has(y) && on && !iframes.on()) {
            session.loseLife('crash');
            iframes.trigger();
            if (!session.dead) resetSpot();
          }
          if (RIVER.has(y) && !on && !iframes.on()) {
            session.loseLife('crash');
            iframes.trigger();
            if (!session.dead) resetSpot();
          }
        }
      },
      draw(gfx) {
        for (let col = 0; col < 10; col++) gfx.plot(col, 0, Math.floor(gfx.time * 2) % 2 === 0 || col % 2 === 0);
        for (const row of rows) {
          for (const item of row.items) {
            const start = Math.round(item.x);
            for (let i = 0; i < item.len; i++) {
              if (row.kind === 'log' && i === 1) continue;
              gfx.plot(start + i, row.y, true);
            }
          }
        }
        const fx = Math.round(x);
        if (iframes.visible() && Math.floor(gfx.time * 8) % 2 === 0) gfx.plot(fx, y, true);
      },
    };
  },
};
