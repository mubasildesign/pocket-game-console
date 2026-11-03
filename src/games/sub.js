import { TUNING } from '../core/constants.js';
import { createAutoRepeat, createIFrames, dirHeld, rand } from './kit.js';

export const sub = {
  id: 'sub',
  title: 'SUB',
  blurb: 'TORPEDO THE HULLS',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let y = 10;
    let shots = [];
    let foes = [];
    let cool = 0;
    let spawn = 2.6;
    let calm = 3;
    let march = 0;
    const repeat = createAutoRepeat(0.14, TUNING.sub.step);
    const iframes = createIFrames();

    function hitSub(foe) {
      return foe.x < 3 && foe.y < y + 3 && foe.y + foe.h > y;
    }

    return {
      update(dt, input) {
        if (session.dead) {
          session.engine(0);
          return;
        }
        iframes.tick(dt);
        session.engine(2.4);
        cool -= dt;
        repeat(dt, dirHeld(input, 'up', 'down'), (dir) => {
          const next = y + dir;
          if (next >= 0 && next <= 17) {
            y = next;
            session.sfx('move');
          }
        });
        if (input.pressed('rotate') && cool <= 0) {
          shots.push({ x: 3, y: y + 1 });
          cool = TUNING.sub.fire;
          session.sfx('rotate');
        }
        march += dt;
        if (march >= TUNING.sub.enemy) {
          march = 0;
          shots.forEach((s) => { s.x += 1; });
          foes.forEach((f) => { f.x -= 1; });
        }
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(1.2, 2.8 - (session.level - 1) * 0.05);
          const mine = session.level > 2 && Math.random() < 0.2;
          let fy = rand(16);
          if (calm > 0) {
            calm -= 1;
            fy = y > 8 ? 2 : 14;
          }
          foes.push({
            x: 10,
            y: fy,
            w: mine ? 1 : 3,
            h: mine ? 1 : 2,
            mine,
          });
        }
        shots = shots.filter((shot) => {
          const foe = foes.find((f) => shot.x >= f.x && shot.x < f.x + f.w && shot.y >= f.y && shot.y < f.y + f.h);
          if (!foe) return shot.x < 10;
          foes = foes.filter((f) => f !== foe);
          session.addScore(foe.mine ? 20 : 50);
          session.sfx('clear');
          return false;
        });
        foes = foes.filter((foe) => {
          if (hitSub(foe) && !iframes.on()) {
            session.loseLife('crash');
            iframes.trigger();
            return false;
          }
          if (foe.x + foe.w < 0) return false;
          return true;
        });
      },
      draw(gfx) {
        if (iframes.visible()) {
          gfx.plot(0, y + 1, true);
          gfx.plot(1, y, true);
          gfx.plot(1, y + 1, true);
          gfx.plot(1, y + 2, true);
          gfx.plot(2, y + 1, true);
        }
        for (const s of shots) gfx.plot(s.x, s.y, true);
        for (const f of foes) {
          for (let row = 0; row < f.h; row++) {
            for (let col = 0; col < f.w; col++) gfx.plot(f.x + col, f.y + row, true);
          }
        }
      },
      destroy() {
        session.engine(0);
      },
    };
  },
};
