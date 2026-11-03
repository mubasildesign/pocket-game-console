import { clamp, createIFrames } from './kit.js';

export const basket = {
  id: 'catch',
  title: 'CATCH',
  blurb: 'SLIDE UNDER THE FRUIT',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let x = 3;
    let items = [];
    let tick = 0;
    let spawn = 1.4;
    let caught = 0;
    let misses = 0;
    const iframes = createIFrames(1);

    function pace() {
      return Math.max(0.1, 0.32 - (session.level - 1) * 0.028);
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        if (input.pressed('left')) x = clamp(x - 1, 0, 7);
        else if (input.pressed('right')) x = clamp(x + 1, 0, 7);
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(0.9, 1.8 - (session.level - 1) * 0.03);
          const bad = caught >= 12 && Math.random() < 0.18;
          let spot = Math.floor(Math.random() * 8);
          if (bad) spot = x > 3 ? 1 : 6;
          items.push({ x: spot, y: -1, bad });
        }
        tick += dt;
        if (tick < pace()) return;
        tick = 0;
        items.forEach((item) => { item.y += 1; });
        items = items.filter((item) => {
          const inBasket = item.y >= 17 && item.x >= x && item.x < x + 3;
          if (inBasket) {
            if (item.bad && !iframes.on()) {
              session.loseLife('hit');
              iframes.trigger();
            } else if (!item.bad) {
              caught += 1;
              misses = Math.max(0, misses - 1);
              session.addScore(20);
              session.sfx('catch');
              if (caught % 10 === 0) session.setLevel(session.level + 1);
            }
            return false;
          }
          if (item.y > 19) {
            if (!item.bad) {
              misses += 1;
              if (misses >= 6 && !iframes.on()) {
                session.loseLife('hit');
                iframes.trigger();
                misses = 0;
              }
            }
            return false;
          }
          return true;
        });
      },
      draw(gfx) {
        for (let i = 0; i < 3; i++) gfx.plot(x + i, 18, true);
        for (const item of items) {
          if (item.bad) {
            gfx.plot(item.x, item.y, true);
            gfx.plot(item.x, item.y + 1, Math.floor(gfx.time * 6) % 2 === 0);
          } else {
            gfx.plot(item.x, item.y, true);
          }
        }
      },
    };
  },
};
