import { PALETTE, PLAY } from '../core/constants.js';
import { aabb, createIFrames } from './kit.js';

export const heli = {
  id: 'heli',
  title: 'HELI',
  blurb: 'HOLD UP OR Z TO RISE',
  era: 'lcd',
  layout: 'full',
  group: 'arcade',
  lives: 3,
  create(session) {
    let y = PLAY.y + 200;
    let walls = [];
    let spawn = 1.3;
    let flown = 0;
    const iframes = createIFrames(1);

    function gapSize() {
      return Math.max(110, 240 - (session.level - 1) * 14);
    }

    function speed() {
      return 90 + (session.level - 1) * 16;
    }

    function resetCave() {
      y = PLAY.y + 180;
      walls = [];
      spawn = 0.8;
    }

    return {
      update(dt, input) {
        if (session.dead) {
          session.engine(0);
          return;
        }
        iframes.tick(dt);
        const lift = input.held('up') || input.held('rotate');
        session.engine(lift ? 2.4 : 1.5);
        y += (lift ? -170 : 70) * dt;
        y = Math.max(PLAY.y + 18, Math.min(PLAY.y + PLAY.h - 30, y));
        const scroll = speed();
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(0.7, 1.35 - (session.level - 1) * 0.08);
          const gap = gapSize();
          const gapY = Math.max(PLAY.y + 16, Math.min(y - gap * 0.45, PLAY.y + PLAY.h - gap - 16));
          walls.push({ x: PLAY.x + PLAY.w + 4, gapY, gap, w: 34 });
        }
        const body = { x: PLAY.x + 46, y: y - 8, w: 26, h: 16 };
        for (const wall of walls) {
          wall.x -= scroll * dt;
          const top = { x: wall.x, y: PLAY.y, w: wall.w, h: Math.max(0, wall.gapY - PLAY.y) };
          const bot = { x: wall.x, y: wall.gapY + wall.gap, w: wall.w, h: Math.max(0, PLAY.y + PLAY.h - (wall.gapY + wall.gap)) };
          if (!iframes.on() && (aabb(body, top) || aabb(body, bot))) {
            session.loseLife('crash');
            iframes.trigger();
            session.engine(0);
            if (!session.dead) resetCave();
            return;
          }
        }
        const before = walls.length;
        walls = walls.filter((wall) => wall.x > PLAY.x - 50);
        if (walls.length < before) {
          flown += 1;
          session.addScore(15, true);
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        gfx.rect(PLAY.x, PLAY.y, PLAY.w, 10, ink);
        gfx.rect(PLAY.x, PLAY.y + PLAY.h - 10, PLAY.w, 10, ink);
        for (const wall of walls) {
          if (wall.gapY > PLAY.y) gfx.rect(wall.x, PLAY.y, wall.w, wall.gapY - PLAY.y, ink);
          const botY = wall.gapY + wall.gap;
          if (botY < PLAY.y + PLAY.h) gfx.rect(wall.x, botY, wall.w, PLAY.y + PLAY.h - botY, ink);
        }
        if (iframes.visible()) {
          gfx.rect(PLAY.x + 36, y - 16, 52, 8, ink);
          gfx.rect(PLAY.x + 46, y - 8, 34, 18, ink);
          gfx.rect(PLAY.x + 74, y - 2, 16, 6, ink);
        }
      },
      destroy() {
        session.engine(0);
      },
    };
  },
};
