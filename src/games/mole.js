import { createAutoRepeat, dirHeld } from './kit.js';

const HOLES = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) HOLES.push({ x: 1 + col * 3, y: 4 + row * 5 });
}

export const mole = {
  id: 'mole',
  title: 'MOLE',
  blurb: 'MOVE AND PRESS Z',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let cursor = 4;
    let moleAt = 4;
    let up = 1.35;
    let gap = 0;
    let hits = 0;
    let misses = 0;
    const repeatX = createAutoRepeat(0.14, 0.12);
    const repeatY = createAutoRepeat(0.14, 0.12);

    function stay() {
      return Math.max(0.55, 1.35 - (session.level - 1) * 0.08);
    }

    function pop() {
      const choices = HOLES.map((_, index) => index).filter((index) => index !== moleAt);
      moleAt = choices[Math.floor(Math.random() * choices.length)];
      up = stay();
    }

    function move(dx, dy) {
      const col = cursor % 3;
      const row = Math.floor(cursor / 3);
      const nc = Math.max(0, Math.min(2, col + dx));
      const nr = Math.max(0, Math.min(2, row + dy));
      const next = nr * 3 + nc;
      if (next !== cursor) {
        cursor = next;
        session.sfx('move');
      }
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        repeatX(dt, dirHeld(input, 'left', 'right'), (dir) => move(dir, 0));
        repeatY(dt, dirHeld(input, 'up', 'down'), (dir) => move(0, dir));
        if (gap > 0) {
          gap -= dt;
          if (gap <= 0) pop();
          return;
        }
        if (input.pressed('rotate') || input.pressed('confirm')) {
          if (cursor === moleAt) {
            hits += 1;
            session.addScore(25);
            session.sfx('catch');
            gap = 0.18;
            return;
          }
          session.sfx('hit');
        }
        up -= dt;
        if (up <= 0) {
          misses += 1;
          if (misses >= 4) {
            session.loseLife('hit');
            misses = 0;
          }
          gap = 0.22;
        }
      },
      draw(gfx) {
        HOLES.forEach((hole, index) => {
          gfx.plot(hole.x, hole.y + 1, true);
          gfx.plot(hole.x + 1, hole.y + 1, true);
          if (index === cursor) {
            gfx.plot(hole.x, hole.y, true);
            gfx.plot(hole.x + 1, hole.y, true);
          }
          if (index === moleAt && gap <= 0) {
            gfx.plot(hole.x, hole.y - 1, true);
            gfx.plot(hole.x + 1, hole.y - 1, true);
            gfx.plot(hole.x, hole.y, true);
            gfx.plot(hole.x + 1, hole.y, true);
          }
        });
      },
    };
  },
};
