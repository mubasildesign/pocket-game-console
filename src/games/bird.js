import { PLAY, PALETTE, TUNING } from '../core/constants.js';
import { aabb, createIFrames } from './kit.js';

export const bird = {
  id: 'bird',
  title: 'BIRD',
  blurb: 'FLAP THROUGH THE GAPS',
  era: 'lcd',
  layout: 'full',
  lives: 3,
  create(session) {
    const ground = PLAY.y + PLAY.h - 28;
    let y = PLAY.y + 160;
    let vy = 0;
    let pipes = [];
    let spawn = 1.5;
    let passed = 0;
    let started = false;
    const iframes = createIFrames(1);

    function resetBird() {
      y = PLAY.y + 160;
      vy = 0;
      pipes = [];
      spawn = 2.2;
      started = false;
    }

    return {
      update(dt, input) {
        if (session.dead) {
          session.engine(0);
          return;
        }
        iframes.tick(dt);
        const flap = input.pressed('rotate') || input.pressed('up');
        if (!started) {
          if (!flap) return;
          started = true;
        }
        const speed = TUNING.bird.speed + (session.level - 1) * 16;
        session.engine(1.2 + speed / 120);
        if (flap) {
          vy = TUNING.bird.flap;
          session.sfx('rotate');
        }
        vy += TUNING.bird.gravity * dt;
        y += vy * dt;
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(1.6, 2.6 - (session.level - 1) * 0.04);
          const gap = Math.max(88, TUNING.bird.gap - (session.level - 1) * 8);
          const gapY = PLAY.y + 50 + Math.random() * (ground - PLAY.y - gap - 80);
          pipes.push({ x: PLAY.x + PLAY.w + 10, gapY, gap, w: 42, scored: false });
        }
        const bird = { x: PLAY.x + 70, y: y - 8, w: 16, h: 14 };
        for (const pipe of pipes) {
          pipe.x -= speed * dt;
          if (!pipe.scored && pipe.x + pipe.w < bird.x) {
            pipe.scored = true;
            passed += 1;
            session.addScore(25);
            if (passed % 8 === 0) session.setLevel(session.level + 1);
          }
          const top = { x: pipe.x, y: PLAY.y, w: pipe.w, h: pipe.gapY - PLAY.y };
          const bot = { x: pipe.x, y: pipe.gapY + pipe.gap, w: pipe.w, h: ground - (pipe.gapY + pipe.gap) };
          if (!iframes.on() && (aabb(bird, top) || aabb(bird, bot))) {
            session.loseLife('crash');
            iframes.trigger();
            if (!session.dead) resetBird();
          }
        }
        pipes = pipes.filter((pipe) => pipe.x > -60);
        if ((y < PLAY.y + 8 || y > ground) && !iframes.on()) {
          session.loseLife('crash');
          iframes.trigger();
          if (!session.dead) resetBird();
        }
      },
      draw(gfx) {
        const ink = PALETTE.lcdOn;
        gfx.rect(PLAY.x, ground, PLAY.w, 8, ink);
        for (const pipe of pipes) {
          gfx.rect(pipe.x, PLAY.y, pipe.w, pipe.gapY - PLAY.y, ink);
          gfx.rect(pipe.x, pipe.gapY + pipe.gap, pipe.w, ground - (pipe.gapY + pipe.gap), ink);
          gfx.rect(pipe.x - 4, pipe.gapY - 8, pipe.w + 8, 8, ink);
          gfx.rect(pipe.x - 4, pipe.gapY + pipe.gap, pipe.w + 8, 8, ink);
        }
        if (iframes.visible()) {
          gfx.rect(PLAY.x + 68, y - 10, 20, 16, PALETTE.lcdBg);
          gfx.rect(PLAY.x + 70, y - 8, 16, 12, ink);
          gfx.rect(PLAY.x + 74, y - 5, 4, 4, PALETTE.lcdBg);
          gfx.rect(PLAY.x + 84, y - 4, 8, 4, ink);
        }
      },
      destroy() {
        session.engine(0);
      },
    };
  },
};
