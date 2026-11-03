import { SCREEN, GRID, PALETTE, SPECTACLE } from './constants.js';
import { drawText, textWidth } from './font.js';

export function createDisplay(canvas) {
  const { W, H } = SCREEN;
  canvas.width = W;
  canvas.height = H;
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d', { alpha: false });
  const view = canvas.getContext('2d');

  const ghost = new Float32Array(GRID.COLS * GRID.ROWS);
  const curr = new Uint8Array(GRID.COLS * GRID.ROWS);
  const particles = [];
  let kind = 'lcd';
  let time = 0;
  let shakeMag = 0;
  let shakeT = 0;
  let flashA = 0;
  let pulseA = 0;
  let pulseColor = PALETTE.cyan;
  let slam = null;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function fillCell(x, y, color) {
    const pad = 2;
    octx.fillStyle = color;
    octx.fillRect(
      GRID.X + x * GRID.CELL + pad,
      GRID.Y + y * GRID.CELL + pad,
      GRID.CELL - pad * 2,
      GRID.CELL - pad * 2,
    );
  }

  function index(x, y) {
    return y * GRID.COLS + x;
  }

  const gfx = {
    w: W,
    h: H,
    time: 0,
    get kind() {
      return kind;
    },
    rect(x, y, w, h, color) {
      octx.fillStyle = color;
      octx.fillRect(x, y, w, h);
    },
    dot(x, y, r, color) {
      octx.fillStyle = color;
      octx.beginPath();
      octx.arc(x, y, r, 0, Math.PI * 2);
      octx.fill();
    },
    glow(x, y, r, color) {
      const g = octx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = g;
      octx.beginPath();
      octx.arc(x, y, r, 0, Math.PI * 2);
      octx.fill();
    },
    text(str, x, y, color, scale = 1) {
      return drawText(octx, str, x, y, color, scale);
    },
    textWidth(str, scale = 1) {
      return textWidth(str, scale);
    },
    plot(x, y, on = true) {
      if (x < 0 || y < 0 || x >= GRID.COLS || y >= GRID.ROWS) return;
      const i = index(x, y);
      if (on) {
        curr[i] = 1;
        fillCell(x, y, PALETTE.lcdOn);
      }
    },
    rule() {
      octx.fillStyle = PALETTE.lcdDim;
      octx.fillRect(0, 44, W, 2);
    },
  };

  function begin(next) {
    kind = next;
    curr.fill(0);
    if (kind === 'off') {
      octx.fillStyle = '#141816';
      octx.fillRect(0, 0, W, H);
      octx.fillStyle = '#243028';
      for (let y = 10; y < H; y += 16) {
        for (let x = 10; x < W; x += 16) octx.fillRect(x, y, 2, 2);
      }
      return;
    }
    if (kind === 'glass') {
      const g = octx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, PALETTE.glassTop);
      g.addColorStop(1, PALETTE.glassBot);
      octx.fillStyle = g;
      octx.fillRect(0, 0, W, H);
      return;
    }
    octx.fillStyle = PALETTE.lcdBg;
    octx.fillRect(0, 0, W, H);
    octx.fillStyle = PALETTE.lcdDim;
    const step = kind === 'lcd-grid' ? 12 : 10;
    for (let y = 6; y < H; y += step) {
      for (let x = 6; x < W; x += step) octx.fillRect(x, y, 2, 2);
    }
    if (kind === 'lcd-grid') {
      octx.fillStyle = PALETTE.lcdWell;
      octx.fillRect(GRID.X - 4, GRID.Y - 4, GRID.COLS * GRID.CELL + 8, GRID.ROWS * GRID.CELL + 8);
      for (let y = 0; y < GRID.ROWS; y++) {
        for (let x = 0; x < GRID.COLS; x++) {
          const i = index(x, y);
          if (ghost[i] > 0.22) {
            octx.globalAlpha = Math.min(0.55, ghost[i] * 0.45);
            fillCell(x, y, PALETTE.lcdGhost);
            octx.globalAlpha = 1;
          } else {
            octx.fillStyle = PALETTE.lcdDim;
            const px = GRID.X + x * GRID.CELL + GRID.CELL / 2;
            const py = GRID.Y + y * GRID.CELL + GRID.CELL / 2;
            octx.fillRect(px - 1, py - 1, 2, 2);
          }
        }
      }
    }
  }

  function shake(mag) {
    shakeMag = Math.max(shakeMag, reduce ? mag * 0.25 : mag);
    shakeT = 0.18;
  }

  function flash(amount = 0.45) {
    flashA = Math.max(flashA, reduce ? amount * 0.35 : amount);
  }

  function pulse(color) {
    pulseA = 0.28;
    pulseColor = color || PALETTE.cyan;
  }

  function burst(x, y, color, n = SPECTACLE.BURST_COUNT) {
    const count = reduce ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      if (particles.length >= SPECTACLE.BURST_MAX) particles.shift();
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 30 + Math.random() * 80;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.2,
        max: 0.5,
        r: 2 + Math.random() * 2,
        color: color || PALETTE.amber,
      });
    }
  }

  function slamText(text) {
    slam = { text, age: 0 };
  }

  function present(dt) {
    time += dt;
    gfx.time = time;
    if (kind === 'lcd-grid') {
      for (let i = 0; i < ghost.length; i++) ghost[i] = curr[i] ? 1 : ghost[i] * 0.84;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 20 * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      octx.globalAlpha = Math.max(0, p.life / p.max);
      octx.fillStyle = p.color;
      octx.fillRect(p.x, p.y, p.r, p.r);
      octx.globalAlpha = 1;
    }

    octx.fillStyle = kind === 'glass' ? 'rgba(0,0,0,0.16)' : 'rgba(20,30,16,0.05)';
    for (let y = (time * 28) % 3; y < H; y += 3) octx.fillRect(0, y, W, 1);

    const sx = shakeT > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    const sy = shakeT > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    shakeT = Math.max(0, shakeT - dt);
    if (shakeT === 0) shakeMag = 0;

    view.fillStyle = kind === 'glass' ? PALETTE.glassBot : kind === 'off' ? '#141816' : PALETTE.lcdBg;
    view.fillRect(0, 0, W, H);
    view.drawImage(off, sx, sy);

    if (pulseA > 0 && kind === 'glass') {
      view.save();
      view.globalCompositeOperation = 'screen';
      view.fillStyle = pulseColor;
      view.globalAlpha = pulseA;
      view.fillRect(0, 0, W, H);
      view.restore();
      pulseA = Math.max(0, pulseA - dt * 1.4);
    }

    if (flashA > 0) {
      view.fillStyle = `rgba(255,255,255,${flashA})`;
      view.fillRect(0, 0, W, H);
      flashA = Math.max(0, flashA - dt * 1.8);
    }

    if (slam) {
      slam.age += dt;
      const p = Math.min(1, slam.age / 0.22);
      const sc = 1 + (1 - p) * (1 - p) * 1.4;
      const alpha = slam.age < 0.7 ? 1 : Math.max(0, 1 - (slam.age - 0.7) / 0.35);
      view.save();
      view.translate(W / 2, H * 0.42);
      view.scale(sc, sc);
      view.globalAlpha = alpha;
      view.font = '900 42px Impact, "Arial Black", sans-serif';
      view.textAlign = 'center';
      view.textBaseline = 'middle';
      view.lineWidth = 8;
      view.strokeStyle = PALETTE.ink;
      view.strokeText(slam.text, 0, 0);
      view.fillStyle = '#fff6c2';
      view.fillText(slam.text, 0, 0);
      view.restore();
      if (slam.age > 1.1) slam = null;
    }
  }

  return { gfx, begin, present, shake, flash, pulse, burst, slam: slamText, get time() { return time; } };
}
