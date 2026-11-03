import { TUNING } from '../core/constants.js';
import { createIFrames, DIRS } from './kit.js';

const MAP = [
  '##########',
  '#........#',
  '#.##..##.#',
  '#........#',
  '#..#..#..#',
  '#..#..#..#',
  '#........#',
  '#.##..##.#',
  '#........#',
  '#..####..#',
  '#........#',
  '#........#',
  '#.##..##.#',
  '#........#',
  '#..#..#..#',
  '#..#..#..#',
  '#........#',
  '#.##..##.#',
  '#........#',
  '##########',
];

function blocked(x, y) {
  if (x < 0 || y < 0 || x >= 10 || y >= 20) return true;
  return MAP[y][x] === '#';
}

function aimAt(from, to) {
  if (from.x !== to.x && from.y !== to.y) return -1;
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let x = from.x + dx;
  let y = from.y + dy;
  while (x !== to.x || y !== to.y) {
    if (blocked(x, y)) return -1;
    x += dx;
    y += dy;
  }
  if (dx === 1) return 1;
  if (dx === -1) return 3;
  if (dy === 1) return 2;
  return 0;
}

export const tank = {
  id: 'tank',
  title: 'TANK',
  blurb: 'ARROWS MOVE  Z FIRES',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let px = 2;
    let py = 17;
    let pdir = 0;
    let ex = 7;
    let ey = 2;
    let edir = 2;
    let shells = [];
    let moveCool = 0;
    let think = 0;
    let shot = 0;
    let shellT = 0;
    let kills = 0;
    const iframes = createIFrames();

    function launch(owner, x, y, dir) {
      const d = DIRS[dir];
      const sx = x + d.x;
      const sy = y + d.y;
      if (!blocked(sx, sy)) shells.push({ x: sx, y: sy, dir, owner });
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        moveCool -= dt;
        let want = -1;
        if (input.held('up') || input.pressed('up')) want = 0;
        else if (input.held('right') || input.pressed('right')) want = 1;
        else if (input.held('down') || input.pressed('down')) want = 2;
        else if (input.held('left') || input.pressed('left')) want = 3;
        if (want >= 0 && moveCool <= 0) {
          pdir = want;
          const d = DIRS[want];
          const nx = px + d.x;
          const ny = py + d.y;
          if (!blocked(nx, ny)) {
            px = nx;
            py = ny;
            session.sfx('move');
          }
          moveCool = TUNING.tank.step;
        }
        if (input.pressed('rotate') && !shells.some((s) => s.owner === 'player')) {
          launch('player', px, py, pdir);
          session.sfx('lock');
        }
        think += dt;
        shot += dt;
        const pace = Math.max(0.12, TUNING.tank.enemy - (session.level - 1) * 0.028);
        if (think >= pace) {
          think = 0;
          const aim = aimAt({ x: ex, y: ey }, { x: px, y: py });
          if (aim >= 0) edir = aim;
          else if (Math.random() < 0.4) edir = Math.floor(Math.random() * 4);
          const d = DIRS[edir];
          if (!blocked(ex + d.x, ey + d.y)) {
            ex += d.x;
            ey += d.y;
          } else edir = (edir + 1) % 4;
        }
        if (shot >= Math.max(1.8, TUNING.tank.shoot - (session.level - 1) * 0.04)) {
          shot = 0;
          const aim = aimAt({ x: ex, y: ey }, { x: px, y: py });
          if (aim >= 0) launch('enemy', ex, ey, aim);
        }
        shellT += dt;
        if (shellT >= TUNING.tank.shell) {
          shellT = 0;
          const next = [];
          for (const s of shells) {
            const d = DIRS[s.dir];
            s.x += d.x;
            s.y += d.y;
            if (blocked(s.x, s.y)) continue;
            if (s.owner === 'enemy' && s.x === px && s.y === py) {
              if (!iframes.on()) {
                session.loseLife('hit');
                iframes.trigger();
                if (!session.dead) {
                  px = 2;
                  py = 17;
                  pdir = 0;
                }
              }
              continue;
            }
            if (s.owner === 'player' && s.x === ex && s.y === ey) {
              kills += 1;
              session.addScore(100);
              session.sfx('clear');
              ex = 7;
              ey = 2;
              if (kills % 3 === 0) session.setLevel(session.level + 1);
              continue;
            }
            next.push(s);
          }
          shells = next;
        }
        if (px === ex && py === ey && !iframes.on()) {
          session.loseLife('hit');
          iframes.trigger();
          if (!session.dead) {
            px = 2;
            py = 17;
          }
        }
      },
      draw(gfx) {
        for (let y = 0; y < 20; y++) {
          for (let x = 0; x < 10; x++) if (MAP[y][x] === '#') gfx.plot(x, y, true);
        }
        const body = (x, y, dir, show) => {
          if (!show) return;
          gfx.plot(x, y, true);
          const d = DIRS[dir];
          if (!blocked(x + d.x, y + d.y)) gfx.plot(x + d.x, y + d.y, true);
        };
        body(px, py, pdir, iframes.visible());
        body(ex, ey, edir, true);
        for (const s of shells) gfx.plot(s.x, s.y, true);
      },
    };
  },
};
