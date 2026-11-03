import { clamp, createIFrames } from './kit.js';

export const ants = {
  id: 'ants',
  title: 'ANTS',
  blurb: 'EAT EVERY CRUMB',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let px = 1;
    let py = 16;
    let crumbs = [];
    let spider = { x: 8, y: 2 };
    let freeze = 6;
    let step = 0;
    const iframes = createIFrames(1.3);

    function lay() {
      const spots = [
        { x: 4, y: 15 },
        { x: 7, y: 12 },
        { x: 2, y: 9 },
        { x: 6, y: 6 },
        { x: 3, y: 3 },
      ];
      const count = Math.min(spots.length, 3 + Math.floor((session.level - 1) / 2));
      crumbs = spots.slice(0, count);
      px = 1;
      py = 16;
      spider = { x: 8, y: 2 };
      freeze = 4;
    }

    lay();

    function pace() {
      return Math.max(0.42, 0.72 - (session.level - 1) * 0.02);
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        if (input.pressed('left')) px = clamp(px - 1, 0, 9);
        if (input.pressed('right')) px = clamp(px + 1, 0, 9);
        if (input.pressed('up')) py = clamp(py - 1, 1, 18);
        if (input.pressed('down')) py = clamp(py + 1, 1, 18);
        const bite = crumbs.findIndex((crumb) => crumb.x === px && crumb.y === py);
        if (bite >= 0) {
          crumbs.splice(bite, 1);
          session.addScore(40);
          session.sfx('catch');
          if (!crumbs.length) {
            session.setLevel(session.level + 1);
            session.addScore(100);
            session.sfx('clear');
            lay();
          }
        }
        freeze -= dt;
        if (freeze > 0) return;
        step += dt;
        if (step < pace()) return;
        step = 0;
        const chase = Math.random() < 0.45;
        if (chase) {
          if (spider.x !== px) spider.x += Math.sign(px - spider.x);
          else if (spider.y !== py) spider.y += Math.sign(py - spider.y);
        } else {
          spider.x = clamp(spider.x + (Math.random() < 0.5 ? -1 : 1), 0, 9);
          spider.y = clamp(spider.y + (Math.random() < 0.5 ? -1 : 1), 1, 18);
        }
        if (spider.x === px && spider.y === py && !iframes.on()) {
          session.loseLife('hit');
          iframes.trigger();
          spider = { x: 8, y: 2 };
          freeze = 3;
        }
      },
      draw(gfx) {
        for (const crumb of crumbs) {
          if (Math.floor(gfx.time * 5) % 2 === 0) gfx.plot(crumb.x, crumb.y, true);
        }
        gfx.plot(spider.x, spider.y, true);
        gfx.plot(spider.x + 1, spider.y, true);
        if (iframes.visible()) {
          gfx.plot(px, py, true);
          gfx.plot(px, py + 1, true);
        }
      },
    };
  },
};
