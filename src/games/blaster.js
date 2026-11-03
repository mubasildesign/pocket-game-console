import { TUNING } from '../core/constants.js';
import { createAutoRepeat, createIFrames, dirHeld, rand } from './kit.js';

export const blaster = {
  id: 'blaster',
  title: 'BLAST',
  blurb: 'SHOOT THE FALLING BRICKS',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let x = 3;
    let bullets = [];
    let bricks = [];
    let fire = 0;
    let fall = 0;
    let shotStep = 0;
    let spawn = 2.4;
    let calm = 4;
    let cleared = 0;
    const repeat = createAutoRepeat(0.16, TUNING.blaster.step);
    const iframes = createIFrames();

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        fire -= dt;
        repeat(dt, dirHeld(input, 'left', 'right'), (dir) => {
          const next = x + dir;
          if (next >= 0 && next <= 7) {
            x = next;
            session.sfx('move');
          }
        });
        if ((input.pressed('rotate') || input.pressed('up')) && fire <= 0) {
          bullets.push({ x: x + 1, y: 18 });
          fire = TUNING.blaster.fire;
          session.sfx('rotate');
        }
        shotStep += dt;
        if (shotStep >= 0.045) {
          shotStep = 0;
          bullets.forEach((b) => { b.y -= 1; });
        }
        const pace = Math.max(TUNING.blaster.minFall, TUNING.blaster.fall - (session.level - 1) * 0.035);
        fall += dt;
        if (fall >= pace) {
          fall = 0;
          bricks.forEach((b) => { b.y += 1; });
        }
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(1.15, 2.5 - (session.level - 1) * 0.05);
          let spot = rand(8);
          if (calm > 0) {
            calm -= 1;
            spot = x >= 4 ? 0 : 6;
          }
          bricks.push({ x: spot, y: -2, w: 2 });
        }
        bullets = bullets.filter((b) => b.y >= 0);
        bricks = bricks.filter((brick) => {
          const shot = bullets.find((b) => b.y >= brick.y && b.y < brick.y + 2 && b.x >= brick.x && b.x < brick.x + brick.w);
          if (shot) {
            bullets = bullets.filter((b) => b !== shot);
            session.addScore(25);
            session.sfx('clear');
            cleared += 1;
            if (cleared % 14 === 0) session.setLevel(session.level + 1);
            return false;
          }
          if (brick.y >= 18) {
            const under = brick.x < x + 3 && brick.x + brick.w > x;
            if (under && !iframes.on()) {
              session.loseLife('hit');
              iframes.trigger();
            }
            return false;
          }
          return brick.y < 22;
        });
      },
      draw(gfx) {
        if (iframes.visible()) {
          gfx.plot(x, 19, true);
          gfx.plot(x + 1, 18, true);
          gfx.plot(x + 2, 19, true);
        }
        for (const b of bullets) gfx.plot(b.x, b.y, true);
        for (const brick of bricks) {
          for (let col = 0; col < brick.w; col++) {
            gfx.plot(brick.x + col, brick.y, true);
            gfx.plot(brick.x + col, brick.y + 1, true);
          }
        }
      },
    };
  },
};
