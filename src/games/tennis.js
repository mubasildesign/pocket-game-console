import { clamp, createAutoRepeat, dirHeld } from './kit.js';

export const tennis = {
  id: 'tennis',
  title: 'TENNIS',
  blurb: 'MOVE UP AND DOWN',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let py = 8;
    let oy = 8;
    let ball = { x: 5, y: 10, vx: 1, vy: 0 };
    let tick = 0;
    let rally = 0;
    let wait = 0.8;
    const repeat = createAutoRepeat(0.12, 0.08);

    function pace() {
      return Math.max(0.08, 0.2 - (session.level - 1) * 0.018);
    }

    function serve(towardYou) {
      ball = { x: 5, y: 10, vx: towardYou ? -1 : 1, vy: 0 };
      wait = 0.7;
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        repeat(dt, dirHeld(input, 'up', 'down'), (dir) => {
          py = clamp(py + dir, 0, 15);
        });
        if (wait > 0) {
          wait -= dt;
          return;
        }
        tick += dt;
        if (tick < pace()) return;
        tick = 0;
        const cover = ball.y - 2;
        if (!(rally > 6 && rally % 5 === 0)) {
          if (oy < cover) oy += 1;
          else if (oy > cover) oy -= 1;
          oy = clamp(oy, 0, 15);
        }
        ball.x += ball.vx;
        ball.y = clamp(ball.y + ball.vy, 0, 19);
        if (ball.y === 0 || ball.y === 19) ball.vy *= -1;
        if (ball.x <= 1 && ball.vx < 0) {
          if (ball.y >= py && ball.y < py + 5) {
            ball.vx = 1;
            ball.x = 1;
            const hit = ball.y - (py + 2);
            ball.vy = hit === 0 ? 0 : Math.sign(hit);
            if (rally < 4) ball.vy = 0;
            rally += 1;
            session.addScore(10);
            session.sfx('lock');
            if (rally % 8 === 0) session.setLevel(session.level + 1);
          } else {
            session.loseLife('hit');
            rally = Math.max(0, rally - 1);
            if (!session.dead) serve(false);
          }
        } else if (ball.x >= 8 && ball.vx > 0) {
          if (ball.y >= oy && ball.y < oy + 5) {
            ball.vx = -1;
            ball.x = 8;
            ball.vy = rally < 4 ? 0 : (rally % 2 === 0 ? 1 : -1);
            session.sfx('move');
          } else {
            session.addScore(40);
            session.sfx('clear');
            rally += 1;
            if (rally % 8 === 0) session.setLevel(session.level + 1);
            serve(false);
          }
        }
      },
      draw(gfx) {
        for (let i = 0; i < 5; i++) {
          gfx.plot(0, py + i, true);
          gfx.plot(9, oy + i, true);
        }
        for (let y = 0; y < 20; y += 2) gfx.plot(5, y, true);
        gfx.plot(ball.x, ball.y, true);
      },
    };
  },
};
