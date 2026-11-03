import { clamp } from './kit.js';

const PINS = [
  { x: 4, y: 2 },
  { x: 3, y: 3 },
  { x: 5, y: 3 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
];

export const bowl = {
  id: 'bowl',
  title: 'BOWL',
  blurb: 'Z ROLLS  ARROWS NUDGE',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let ball = { x: 4, y: 17 };
    let rolling = false;
    let pins = PINS.map((pin) => ({ ...pin, up: true }));
    let tick = 0;
    let frames = 0;
    let gutters = 0;
    let wind = 0;

    function resetLane() {
      ball = { x: 4, y: 17 };
      rolling = false;
      pins = PINS.map((pin) => ({ ...pin, up: true }));
      wind = frames >= 6 ? (frames % 2 === 0 ? 1 : -1) : 0;
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        if (!rolling) {
          if (input.pressed('left')) ball.x = clamp(ball.x - 1, 3, 5);
          if (input.pressed('right')) ball.x = clamp(ball.x + 1, 3, 5);
          if (input.pressed('rotate') || input.pressed('up')) {
            rolling = true;
            session.sfx('rotate');
          }
          return;
        }
        tick += dt;
        if (tick < 0.14) return;
        tick = 0;
        if (input.pressed('left')) ball.x -= 1;
        if (input.pressed('right')) ball.x += 1;
        if (ball.y === 10 && wind) ball.x += wind;
        ball.x = clamp(ball.x, 1, 8);
        ball.y -= 1;
        pins.forEach((pin) => {
          if (pin.up && pin.x === ball.x && pin.y === ball.y) {
            pin.up = false;
            session.addScore(25);
            session.sfx('clear');
          }
        });
        const gutter = ball.x < 3 || ball.x > 5;
        if (ball.y <= 1 || gutter) {
          const standing = pins.filter((pin) => pin.up).length;
          if (standing === 0) session.addScore(80);
          frames += 1;
          if (frames % 4 === 0) session.setLevel(session.level + 1);
          if (gutter && standing === PINS.length) {
            gutters += 1;
            if (gutters > 2) session.loseLife('hit');
          } else if (!gutter) {
            gutters = Math.max(0, gutters - 1);
          }
          if (!session.dead) resetLane();
        }
      },
      draw(gfx) {
        for (let y = 1; y < 19; y++) {
          gfx.plot(2, y, true);
          gfx.plot(6, y, true);
        }
        for (const pin of pins) {
          if (pin.up) gfx.plot(pin.x, pin.y, true);
        }
        gfx.plot(ball.x, ball.y, true);
        if (!rolling && Math.floor(gfx.time * 4) % 2 === 0) gfx.plot(ball.x, ball.y - 1, true);
      },
    };
  },
};
