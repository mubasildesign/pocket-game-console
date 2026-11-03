import { PALETTE, PLAY, TUNING } from '../core/constants.js';
import { aabb, createIFrames } from './kit.js';

export const jump = {
  id: 'jump',
  title: 'JUMP',
  blurb: 'HOP THE PITS',
  era: 'lcd',
  layout: 'full',
  lives: 3,
  create(session) {
    const ground = PLAY.y + PLAY.h - 48;
    const player = { x: PLAY.x + 56, y: ground - 16, w: 16, h: 16, vy: 0 };
    let platforms = [{ x: PLAY.x, y: ground, w: 520, h: 14 }];
    let hurdles = [];
    let cursor = PLAY.x + 520;
    let onGround = true;
    let run = 0;
    const iframes = createIFrames(1);

    function more() {
      while (cursor < PLAY.x + PLAY.w + 280) {
        cursor += 28 + Math.random() * 14 + Math.min(20, (session.level - 1) * 1);
        const w = 150 + Math.random() * 90;
        platforms.push({ x: cursor, y: ground, w, h: 14 });
        if (session.level >= 4 && w > 120 && Math.random() < 0.3) hurdles.push({ x: cursor + w * 0.5, y: ground - 18, w: 14, h: 18 });
        cursor += w;
      }
    }

    function resetRun() {
      player.y = ground - 16;
      player.vy = 0;
      platforms = [{ x: PLAY.x, y: ground, w: 520, h: 14 }];
      hurdles = [];
      cursor = PLAY.x + 520;
      onGround = true;
      more();
    }

    more();

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        const speed = TUNING.jump.speed + (session.level - 1) * 12;
        if ((input.pressed('rotate') || input.pressed('up')) && onGround) {
          player.vy = TUNING.jump.flap;
          onGround = false;
          session.sfx('rotate');
        }
        player.vy += TUNING.jump.gravity * dt;
        player.y += player.vy * dt;
        for (const p of platforms) p.x -= speed * dt;
        for (const h of hurdles) h.x -= speed * dt;
        cursor -= speed * dt;
        platforms = platforms.filter((p) => p.x + p.w > PLAY.x - 20);
        hurdles = hurdles.filter((h) => h.x + h.w > PLAY.x - 20);
        more();
        onGround = false;
        const foot = player.y + player.h;
        for (const p of platforms) {
          const over = player.x + player.w > p.x + 2 && player.x < p.x + p.w - 2;
          if (over && player.vy >= 0 && foot >= p.y && player.y <= p.y) {
            player.y = p.y - player.h;
            player.vy = 0;
            onGround = true;
          }
        }
        if (player.y > PLAY.y + PLAY.h && !iframes.on()) {
          session.loseLife('crash');
          iframes.trigger();
          if (!session.dead) resetRun();
        }
        for (const h of hurdles) {
          if (!iframes.on() && aabb(player, h)) {
            session.loseLife('crash');
            iframes.trigger();
            if (!session.dead) resetRun();
            break;
          }
        }
        run += speed * dt;
        if (run >= 70) {
          run -= 70;
          const before = session.score;
          session.addScore(10, true);
          if (Math.floor(session.score / 100) !== Math.floor(before / 100)) {
            session.sfx('score');
            const next = 1 + Math.floor(session.score / 500);
          if (next > session.level) session.setLevel(next);
          }
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        for (const p of platforms) gfx.rect(p.x, p.y, p.w, p.h, ink);
        for (const h of hurdles) gfx.rect(h.x, h.y, h.w, h.h, ink);
        if (iframes.visible()) {
          gfx.rect(player.x - 1, player.y - 1, player.w + 2, player.h + 2, PALETTE.lcdBg);
          gfx.rect(player.x, player.y, player.w, player.h, ink);
          gfx.rect(player.x + 3, player.y + 3, 4, 4, PALETTE.lcdBg);
        }
      },
    };
  },
};
