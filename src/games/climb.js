import { TUNING } from '../core/constants.js';
import { createIFrames } from './kit.js';

const WALKS = [17, 13, 9, 5, 1];
const LADDERS = [
  { x: 2, y0: 13, y1: 17 },
  { x: 7, y0: 9, y1: 13 },
  { x: 3, y0: 5, y1: 9 },
  { x: 6, y0: 1, y1: 5 },
];

export const climb = {
  id: 'climb',
  title: 'CLIMB',
  blurb: 'RACE THE GUARDS',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let px = 1;
    let py = 17;
    let guards = [13, 9, 5].map((y, i) => ({ y, x: 6 - i, dir: i % 2 ? 1 : -1 }));
    let step = 0;
    let patrol = 0;
    let climbs = 0;
    const iframes = createIFrames();

    function onLadder(x, y) {
      return LADDERS.some((l) => l.x === x && y >= l.y0 && y <= l.y1);
    }

    function resetBottom() {
      px = 1;
      py = 17;
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        step -= dt;
        const pace = TUNING.climb.step;
        if (step <= 0) {
          let moved = false;
          if (input.held('left') || input.pressed('left')) {
            if (WALKS.includes(py) && px > 1) { px -= 1; moved = true; }
          } else if (input.held('right') || input.pressed('right')) {
            if (WALKS.includes(py) && px < 8) { px += 1; moved = true; }
          } else if (input.held('up') || input.pressed('up')) {
            if (onLadder(px, py) && py > 1) { py -= 1; moved = true; }
          } else if (input.held('down') || input.pressed('down')) {
            if (onLadder(px, py) && py < 17) { py += 1; moved = true; }
          }
          if (moved) {
            session.sfx('move');
            step = pace;
          }
        }
        const patrolRate = Math.max(0.1, TUNING.climb.patrol - (session.level - 1) * 0.02);
        patrol += dt;
        if (patrol >= patrolRate) {
          patrol = 0;
          for (const g of guards) {
            const next = g.x + g.dir;
            if (next < 1 || next > 8) g.dir *= -1;
            else g.x += g.dir;
          }
        }
        if (guards.some((g) => g.x === px && g.y === py) && !iframes.on()) {
          session.loseLife('hit');
          iframes.trigger();
          if (!session.dead) resetBottom();
        }
        if (py === 1) {
          climbs += 1;
          session.addScore(150);
          session.sfx('clear');
          session.setLevel(session.level + 1);
          resetBottom();
          guards = [13, 9, 5].map((y, i) => ({ y, x: 3 + ((i + climbs) % 5), dir: i % 2 ? 1 : -1 }));
        }
      },
      draw(gfx) {
        for (const y of WALKS) {
          const floor = y + 1;
          for (let x = 0; x < 10; x++) gfx.plot(x, floor, true);
        }
        for (const l of LADDERS) {
          for (let y = l.y0; y <= l.y1; y += 1) {
            if ((y - l.y0) % 2 === 0) gfx.plot(l.x, y, true);
          }
        }
        for (const g of guards) {
          gfx.plot(g.x, g.y, true);
          if (g.x + g.dir > 0 && g.x + g.dir < 10) gfx.plot(g.x + g.dir, g.y, true);
        }
        if (iframes.visible()) gfx.plot(px, py, true);
      },
    };
  },
};
