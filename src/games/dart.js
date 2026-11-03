import { PALETTE, PLAY } from '../core/constants.js';

export const dart = {
  id: 'dart',
  title: 'DART',
  blurb: 'Z WHEN THE SIGHT IS ON',
  era: 'lcd',
  layout: 'full',
  group: 'arcade',
  lives: 3,
  create(session) {
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + 220;
    let sweep = 0.15;
    let dir = 1;
    let misses = 0;
    let mark = null;
    let markT = 0;

    function aim() {
      const span = 110;
      return {
        x: cx - span + sweep * span * 2,
        y: cy + Math.sin(sweep * Math.PI) * 36,
      };
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        const rate = 0.45 + (session.level - 1) * 0.12;
        sweep += dir * rate * dt;
        if (sweep >= 1) {
          sweep = 1;
          dir = -1;
        } else if (sweep <= 0) {
          sweep = 0;
          dir = 1;
        }
        markT -= dt;
        if (markT <= 0) mark = null;
        if (!(input.pressed('rotate') || input.pressed('confirm'))) return;
        const shot = aim();
        const dist = Math.hypot(shot.x - cx, shot.y - cy);
        mark = shot;
        markT = 1.1;
        if (dist < 26) {
          session.addScore(100);
          session.sfx('clear');
          misses = Math.max(0, misses - 1);
        } else if (dist < 58) {
          session.addScore(40);
          session.sfx('catch');
        } else if (dist < 96) {
          session.addScore(15);
          session.sfx('lock');
        } else {
          misses += 1;
          session.sfx('hit');
          if (misses >= 5) {
            session.loseLife('hit');
            misses = 0;
          }
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        gfx.rect(cx - 96, cy - 96, 192, 192, PALETTE.lcdDim);
        gfx.rect(cx - 58, cy - 58, 116, 116, ink);
        gfx.rect(cx - 26, cy - 26, 52, 52, PALETTE.lcdBg);
        gfx.rect(cx - 8, cy - 8, 16, 16, ink);
        const shot = aim();
        gfx.rect(shot.x - 14, shot.y - 2, 28, 4, ink);
        gfx.rect(shot.x - 2, shot.y - 14, 4, 28, ink);
        if (mark) gfx.rect(mark.x - 5, mark.y - 5, 10, 10, ink);
      },
    };
  },
};
