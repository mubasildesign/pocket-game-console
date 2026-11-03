import { PALETTE, TUNING } from '../core/constants.js';
import { cellBox, createAutoRepeat, createIFrames, dirHeld } from './kit.js';

const MAZES = [
  [
    '##########',
    '#P..#....#',
    '#.#.#.##.#',
    '#.#......#',
    '#.#.####.#',
    '#...#....#',
    '###.#.##.#',
    '#.....#..#',
    '#.###.#.##',
    '#.#......#',
    '#.#.###..#',
    '#.#...#..#',
    '#.######.#',
    '#......#.#',
    '####.#.#.#',
    '#....#...#',
    '#.##.###.#',
    '#.#......#',
    '#......E.#',
    '##########',
  ],
  [
    '##########',
    '#E..#....#',
    '#.#.#.##.#',
    '#.#......#',
    '#.####.#.#',
    '#......#.#',
    '##.###.#.#',
    '#....#...#',
    '#.##.#.###',
    '#.#......#',
    '#.#.####.#',
    '#.#......#',
    '#.######.#',
    '#........#',
    '###.##.#.#',
    '#....#.#.#',
    '#.####.#.#',
    '#......#.#',
    '#P.......#',
    '##########',
  ],
];

export const maze = {
  id: 'maze',
  title: 'MAZE',
  blurb: 'EAT EVERY DOT',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let walls = [];
    let dots = [];
    let px = 1;
    let py = 1;
    let ex = 1;
    let ey = 1;
    let mapIndex = 0;
    let spawn = { x: 1, y: 1 };
    let nest = { x: 8, y: 18 };
    let step = 0;
    let chase = 0;
    let calm = 3.5;
    const repeat = createAutoRepeat(0.14, TUNING.maze.step);
    const iframes = createIFrames(1.3);

    function load(index) {
      const rows = MAZES[index % MAZES.length];
      walls = [];
      dots = [];
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '#') walls.push(`${x},${y}`);
          else if (ch === 'P') { px = x; py = y; spawn = { x, y }; }
          else if (ch === 'E') { ex = x; ey = y; nest = { x, y }; }
          else dots.push(`${x},${y}`);
        }
      });
      const start = `${px},${py}`;
      dots = dots.filter((d) => d !== start);
    }

    function wallAt(x, y) {
      return walls.includes(`${x},${y}`) || x < 0 || y < 0 || x >= 10 || y >= 20;
    }

    load(0);

    return {
      update(dt, input) {
        if (session.dead) return;
        iframes.tick(dt);
        const pace = Math.max(0.07, TUNING.maze.step);
        repeat(dt, dirHeld(input, 'left', 'right') || 0, (dir) => {
          const nx = px + dir;
          if (!wallAt(nx, py)) {
            px = nx;
            session.sfx('move');
          }
        });
        const v = dirHeld(input, 'up', 'down');
        if (input.pressed('up') || input.pressed('down')) {
          const ny = py + v;
          if (v && !wallAt(px, ny)) {
            py = ny;
            session.sfx('move');
          }
        } else if (v && input.held(v < 0 ? 'up' : 'down')) {
          step += dt;
          if (step >= pace) {
            step = 0;
            const ny = py + v;
            if (!wallAt(px, ny)) py = ny;
          }
        } else step = 0;

        const here = `${px},${py}`;
        if (dots.includes(here)) {
          dots = dots.filter((d) => d !== here);
          session.addScore(10, true);
          session.sfx('score');
          if (!dots.length) {
            mapIndex += 1;
            session.setLevel(session.level + 1);
            session.addScore(200);
            session.sfx('clear');
            load(mapIndex);
            return;
          }
        }
        calm -= dt;
        chase += dt;
        const chaseRate = Math.max(0.12, TUNING.maze.chase - (session.level - 1) * 0.028);
        if (calm > 0) {
          /* the chaser waits so the first corridor is yours */
        } else if (chase >= chaseRate) {
          chase = 0;
          const options = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !wallAt(ex + dx, ey + dy));
          options.sort((a, b) => {
            const da = Math.abs(ex + a[0] - px) + Math.abs(ey + a[1] - py);
            const db = Math.abs(ex + b[0] - px) + Math.abs(ey + b[1] - py);
            return da - db;
          });
          if (options.length && Math.random() < 0.8) {
            ex += options[0][0];
            ey += options[0][1];
          } else if (options.length) {
            const pick = options[Math.floor(Math.random() * options.length)];
            ex += pick[0];
            ey += pick[1];
          }
        }
        if (ex === px && ey === py && !iframes.on()) {
          session.loseLife('hit');
          iframes.trigger();
          if (!session.dead) {
            px = spawn.x;
            py = spawn.y;
            ex = nest.x;
            ey = nest.y;
          }
        }
      },
      draw(gfx) {
        for (const w of walls) {
          const [x, y] = w.split(',').map(Number);
          gfx.plot(x, y, true);
        }
        if (Math.floor(gfx.time * 5) % 2 === 0) {
          for (const d of dots) {
            const [x, y] = d.split(',').map(Number);
            const box = cellBox(x, y);
            gfx.rect(box.x + 9, box.y + 9, 6, 6, PALETTE.lcdOn);
          }
        }
        if (iframes.visible()) gfx.plot(px, py, true);
        const foe = cellBox(ex, ey);
        gfx.rect(foe.x + 3, foe.y + 3, foe.w - 6, 4, PALETTE.lcdOn);
        gfx.rect(foe.x + 8, foe.y + 8, 8, foe.h - 12, PALETTE.lcdOn);
      },
    };
  },
};
