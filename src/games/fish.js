import { clamp, createAutoRepeat, createIFrames, dirHeld } from './kit.js';

export const fish = {
  id: 'fish',
  title: 'FISH',
  blurb: 'Z DROPS  UP REELS',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let boat = 3;
    let hook = 2;
    let dropping = false;
    let dropT = 0;
    let swimT = 0;
    let caught = 0;
    const repeat = createAutoRepeat(0.12, 0.08);
    const iframes = createIFrames(0.8);
    let school = [
      { x: 1, y: 6, dir: 1, boot: false },
      { x: 6, y: 10, dir: -1, boot: false },
      { x: 2, y: 14, dir: 1, boot: false },
    ];

    function swimPace() {
      return Math.max(0.08, 0.16 - (session.level - 1) * 0.012);
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        repeat(dt, dirHeld(input, 'left', 'right'), (dir) => {
          boat = clamp(boat + dir, 0, 7);
        });
        if (!dropping && (input.pressed('rotate') || input.pressed('down'))) {
          dropping = true;
          hook = 3;
          session.sfx('rotate');
        }
        swimT += dt;
        if (swimT >= swimPace()) {
          swimT = 0;
          school.forEach((swimmer) => {
            swimmer.x += swimmer.dir;
            if (swimmer.x <= 0 || swimmer.x >= 7) swimmer.dir *= -1;
          });
        }
        if (!dropping) return;
        if (input.held('up') || input.pressed('up')) {
          hook = Math.max(2, hook - 1);
          if (hook <= 2) dropping = false;
          return;
        }
        dropT += dt;
        const dropPace = Math.max(0.05, 0.09 - (session.level - 1) * 0.004);
        if (dropT < dropPace) return;
        dropT = 0;
        hook += 1;
        const snag = school.find((swimmer) => Math.abs(swimmer.y - hook) <= 1 && Math.abs(swimmer.x - (boat + 1)) <= 1);
        if (snag) {
          if (snag.boot && !iframes.on()) {
            session.loseLife('hit');
            iframes.trigger();
          } else if (!snag.boot) {
            caught += 1;
            session.addScore(30);
            session.sfx('catch');
            if (caught === 6) school.push({ x: 4, y: 14, dir: -1, boot: true });
          }
          school = school.filter((swimmer) => swimmer !== snag);
          if (school.filter((swimmer) => !swimmer.boot).length < 3) {
            school.push({ x: 1, y: snag.y, dir: 1, boot: false });
          }
          dropping = false;
          hook = 2;
          return;
        }
        if (hook >= 18) {
          dropping = false;
          hook = 2;
        }
      },
      draw(gfx) {
        for (let i = 0; i < 3; i++) gfx.plot(boat + i, 1, true);
        for (let y = 2; y <= hook; y++) gfx.plot(boat + 1, y, true);
        for (const swimmer of school) {
          gfx.plot(swimmer.x, swimmer.y, true);
          gfx.plot(swimmer.x + 1, swimmer.y, true);
          gfx.plot(swimmer.x + 2, swimmer.y, !swimmer.boot);
        }
      },
    };
  },
};
