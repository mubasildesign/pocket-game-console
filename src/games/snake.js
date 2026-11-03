import { TUNING } from '../core/constants.js';

const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export const snake = {
  id: 'snake',
  title: 'SNAKE',
  blurb: 'EAT AND GROW',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let body = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
    let dir = 'right';
    let queued = 'right';
    let food = { x: 7, y: 6 };
    let tick = 0;
    let eaten = 0;
    let wait = 0;
    let started = false;

    function freeCell() {
      for (let n = 0; n < 80; n++) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 20);
        if (!body.some((p) => p.x === x && p.y === y)) return { x, y };
      }
      return { x: 0, y: 0 };
    }

    function opposite(a, b) {
      return (a === 'left' && b === 'right') || (a === 'right' && b === 'left')
        || (a === 'up' && b === 'down') || (a === 'down' && b === 'up');
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        if (input.pressed('left')) queued = 'left';
        if (input.pressed('right')) queued = 'right';
        if (input.pressed('up')) queued = 'up';
        if (input.pressed('down')) queued = 'down';
        if (!started) {
          const go = input.pressed('up') || input.pressed('down') || input.pressed('left') || input.pressed('right');
          if (!go || opposite('right', queued)) return;
          started = true;
        }
        if (wait > 0) {
          wait -= dt;
          return;
        }
        const pace = Math.max(TUNING.snake.minTick, TUNING.snake.tick - eaten * 0.006 - (session.level - 1) * 0.018);
        tick += dt;
        if (tick < pace) return;
        tick = 0;
        if (!opposite(dir, queued)) dir = queued;
        const [dx, dy] = D[dir];
        const head = { x: body[0].x + dx, y: body[0].y + dy };
        if (head.x < 0 || head.y < 0 || head.x >= 10 || head.y >= 20 || body.some((p) => p.x === head.x && p.y === head.y)) {
          session.loseLife('crash');
          if (session.dead) return;
          body = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }];
          dir = 'right';
          queued = 'right';
          food = freeCell();
          wait = 0.6;
          return;
        }
        body.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          eaten += 1;
          session.addScore(50);
          session.sfx('clear');
          food = freeCell();
          if (eaten % 8 === 0) session.setLevel(session.level + 1);
        } else {
          body.pop();
        }
      },
      draw(gfx) {
        body.forEach((p, i) => {
          if (i === 0 || i % 2 === 0) gfx.plot(p.x, p.y, true);
          else gfx.plot(p.x, p.y, true);
        });
        if (Math.floor(gfx.time * 6) % 2 === 0) gfx.plot(food.x, food.y, true);
      },
    };
  },
};
