import { clamp, createAutoRepeat, dirHeld } from './kit.js';

export const hockey = {
  id: 'hockey',
  title: 'HOCKEY',
  blurb: 'SKATE INTO THE PUCK',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let px = 4;
    let py = 15;
    const puck = { x: 5, y: 7, vx: 0.4, vy: 1 };
    let goalie = 3;
    let cool = 0;
    const repeatX = createAutoRepeat(0.12, 0.09);
    const repeatY = createAutoRepeat(0.12, 0.09);

    function pace() {
      return 3.2 + (session.level - 1) * 0.55;
    }

    function faceoff() {
      puck.x = 5;
      puck.y = 8;
      puck.vx = Math.random() < 0.5 ? -0.6 : 0.6;
      puck.vy = 1;
      cool = 0.45;
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        repeatX(dt, dirHeld(input, 'left', 'right'), (dir) => {
          px = clamp(px + dir, 0, 8);
        });
        repeatY(dt, dirHeld(input, 'up', 'down'), (dir) => {
          py = clamp(py + dir, 8, 18);
        });
        if (cool > 0) {
          cool -= dt;
          return;
        }
        const speed = pace();
        puck.x += puck.vx * speed * dt;
        puck.y += puck.vy * speed * dt;
        if (puck.x < 0 || puck.x > 9) puck.vx *= -1;
        puck.x = clamp(puck.x, 0, 9);
        const gx = goalie + 1.5;
        goalie += Math.sign(puck.x - gx) * dt * (1.4 + session.level * 0.25);
        goalie = clamp(goalie, 1, 6);
        const near = Math.abs(puck.x - px) < 1.3 && Math.abs(puck.y - py) < 1.3;
        if (near && puck.vy > 0) {
          puck.vy = -1.4;
          puck.vx = (puck.x - px) * 1.6;
          session.sfx('lock');
        }
        if (puck.y < 1) {
          if (puck.x > goalie && puck.x < goalie + 3) {
            puck.vy = Math.abs(puck.vy);
            puck.y = 1.2;
            session.sfx('hit');
          } else {
            session.addScore(80);
            session.sfx('clear');
            faceoff();
          }
        }
        if (puck.y > 18.4) {
          session.loseLife('hit');
          if (!session.dead) faceoff();
        }
      },
      draw(gfx) {
        for (let y = 0; y < 20; y += 3) {
          gfx.plot(0, y, true);
          gfx.plot(9, y, true);
        }
        for (let x = 3; x <= 6; x++) gfx.plot(x, 0, true);
        for (let i = 0; i < 3; i++) gfx.plot(Math.round(goalie) + i, 1, true);
        gfx.plot(Math.round(puck.x), Math.round(puck.y), true);
        gfx.plot(px, py, true);
        gfx.plot(px + 1, py, true);
        gfx.plot(px, py + 1, true);
      },
    };
  },
};
