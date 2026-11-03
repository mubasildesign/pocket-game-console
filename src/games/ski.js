import { clamp, createAutoRepeat, createIFrames, dirHeld } from './kit.js';

export const ski = {
  id: 'ski',
  title: 'SKI',
  blurb: 'HOLD LEFT OR RIGHT',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let x = 4;
    let trees = [];
    let tick = 0;
    let spawn = 0.55;
    let passed = 0;
    let first = true;
    const repeat = createAutoRepeat(0.1, 0.08);
    const iframes = createIFrames(0.9);

    function pace() {
      return Math.max(0.07, 0.18 - (session.level - 1) * 0.016);
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        repeat(dt, dirHeld(input, 'left', 'right'), (dir) => {
          const next = clamp(x + dir, 1, 8);
          if (next !== x) {
            x = next;
            session.sfx('move');
          }
        });
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(0.38, 0.95 - (session.level - 1) * 0.07);
          let spot = 1 + Math.floor(Math.random() * 8);
          if (first || spot === x) spot = x > 4 ? x - 3 : x + 3;
          first = false;
          trees.push({ x: clamp(spot, 1, 8), y: -1 });
          if (session.level > 2 && Math.random() < 0.4) {
            trees.push({ x: clamp(spot + 3, 1, 8), y: -1 });
          }
        }
        tick += dt;
        if (tick < pace()) return;
        tick = 0;
        trees.forEach((tree) => { tree.y += 1; });
        const hit = trees.find((tree) => tree.x === x && (tree.y === 16 || tree.y === 17));
        if (hit && !iframes.on()) {
          session.loseLife('crash');
          iframes.trigger();
          trees = trees.filter((tree) => tree !== hit);
        }
        trees = trees.filter((tree) => {
          if (tree.y < 20) return true;
          passed += 1;
          session.addScore(10, true);
          return false;
        });
      },
      draw(gfx) {
        for (let y = 0; y < 20; y += 3) {
          gfx.plot(0, y, true);
          gfx.plot(9, y, true);
        }
        for (const tree of trees) {
          gfx.plot(tree.x, tree.y, true);
          gfx.plot(tree.x, tree.y + 1, true);
        }
        if (iframes.visible()) {
          gfx.plot(x, 15, true);
          gfx.plot(x, 16, true);
          gfx.plot(x - 1, 17, true);
          gfx.plot(x + 1, 17, true);
        }
      },
    };
  },
};
