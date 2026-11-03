import { PALETTE, PLAY } from '../core/constants.js';

export const land = {
  id: 'land',
  title: 'LAND',
  blurb: 'HOLD UP TO THRUST',
  era: 'lcd',
  layout: 'full',
  group: 'arcade',
  lives: 3,
  create(session) {
    const ground = PLAY.y + PLAY.h - 40;
    let x = PLAY.x + PLAY.w / 2;
    let y = PLAY.y + 90;
    let vx = 0;
    let vy = 0;
    let pause = 0.6;
    let landings = 0;

    function padWidth() {
      return Math.max(100, PLAY.w - 8 - landings * 10);
    }

    function resetShip() {
      x = PLAY.x + PLAY.w / 2;
      y = PLAY.y + 90;
      const drift = landings >= 4 ? (4 + landings) : 0;
      vx = landings % 2 === 0 ? -drift : drift;
      vy = 0;
      pause = 1.1;
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        if (pause > 0) {
          pause -= dt;
          return;
        }
        const gravity = 8 + Math.min(10, (session.level - 1) * 0.6);
        const thrust = input.held('up') || input.held('rotate');
        if (thrust) vy -= 46 * dt;
        if (input.pressed('up') || input.pressed('rotate')) session.sfx('rotate');
        vy += gravity * dt;
        if (input.held('left')) vx -= 28 * dt;
        if (input.held('right')) vx += 28 * dt;
        vx *= 0.99;
        x += vx * dt;
        y += vy * dt;
        x = Math.max(PLAY.x + 16, Math.min(PLAY.x + PLAY.w - 16, x));
        if (y < PLAY.y + 20) {
          y = PLAY.y + 20;
          vy = 0;
        }
        if (y + 14 < ground) return;
        const pad = padWidth();
        const padX = PLAY.x + (PLAY.w - pad) / 2;
        const onPad = x > padX && x < padX + pad;
        const gentle = vy < 120;
        if (onPad && gentle) {
          landings += 1;
          session.addScore(150);
          session.sfx('clear');
          session.setLevel(session.level + 1);
          resetShip();
        } else {
          session.loseLife('crash');
          if (!session.dead) resetShip();
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        const pad = padWidth();
        const padX = PLAY.x + (PLAY.w - pad) / 2;
        gfx.rect(padX, ground, pad, 10, ink);
        gfx.rect(x - 10, y, 20, 14, PALETTE.lcdBg);
        gfx.rect(x - 8, y + 2, 16, 10, ink);
        gfx.rect(x - 3, y + 5, 6, 4, PALETTE.lcdBg);
      },
    };
  },
};
