import { GRID, PALETTE, TUNING } from '../core/constants.js';
import { aabb, createIFrames } from './kit.js';

export const brickout = {
  id: 'brickout',
  title: 'BRICK',
  blurb: 'BREAK THE WALL',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    const left = GRID.X;
    const top = GRID.Y;
    const wellW = GRID.COLS * GRID.CELL;
    const wellH = GRID.ROWS * GRID.CELL;
    let paddle = left + wellW / 2 - 28;
    let ball = { x: left + wellW / 2, y: top + wellH - 40, vx: TUNING.brick.speed, vy: -TUNING.brick.speed };
    let stuck = true;
    let bricks = [];
    const iframes = createIFrames(0.6);

    function build() {
      bricks = [];
      const rows = 3 + Math.min(4, Math.floor((session.level - 1) / 2));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 10; col++) {
          if ((row + col + session.level) % 7 === 0) continue;
          bricks.push({
            x: left + col * GRID.CELL + 1,
            y: top + 12 + row * (GRID.CELL - 4),
            w: GRID.CELL - 2,
            h: GRID.CELL - 8,
          });
        }
      }
    }

    function serve() {
      stuck = true;
      const kick = 1 + (session.level - 1) * 0.025;
      ball.vx = TUNING.brick.speed * kick * (Math.random() < 0.5 ? -1 : 1);
      ball.vy = -TUNING.brick.speed * kick;
    }

    build();
    serve();

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        const speed = input.held('rotate') ? 280 : 190;
        if (input.held('left')) paddle -= speed * dt;
        if (input.held('right')) paddle += speed * dt;
        paddle = Math.max(left, Math.min(left + wellW - 56, paddle));
        if (stuck) {
          ball.x = paddle + 28;
          ball.y = top + wellH - 36;
          if (input.pressed('rotate') || input.pressed('up')) {
            stuck = false;
            session.sfx('rotate');
          }
          return;
        }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < left + 4 || ball.x > left + wellW - 4) ball.vx *= -1;
        if (ball.y < top + 4) ball.vy = Math.abs(ball.vy);
        const pad = { x: paddle, y: top + wellH - 22, w: 56, h: 8 };
        const ballBox = { x: ball.x - 4, y: ball.y - 4, w: 8, h: 8 };
        if (aabb(ballBox, pad) && ball.vy > 0) {
          const hit = (ball.x - (paddle + 28)) / 28;
          ball.vy = -Math.abs(ball.vy);
          ball.vx += hit * 80;
          session.sfx('lock');
        }
        for (let i = bricks.length - 1; i >= 0; i--) {
          if (!aabb(ballBox, bricks[i])) continue;
          bricks.splice(i, 1);
          ball.vy *= -1;
          session.addScore(20);
          session.sfx('clear');
          break;
        }
        if (!bricks.length) {
          session.setLevel(session.level + 1);
          session.addScore(200);
          build();
          serve();
        }
        if (ball.y > top + wellH) {
          if (!iframes.on()) {
            session.loseLife('hit');
            iframes.trigger();
            if (!session.dead) serve();
          }
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        for (const brick of bricks) gfx.rect(brick.x, brick.y, brick.w, brick.h, ink);
        gfx.rect(paddle, top + wellH - 22, 56, 8, ink);
        gfx.rect(ball.x - 4, ball.y - 4, 8, 8, ink);
      },
    };
  },
};
