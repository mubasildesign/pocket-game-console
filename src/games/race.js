import { TUNING } from '../core/constants.js';
import { createIFrames } from './kit.js';

const LANES = [1, 4, 7];

export const race = {
  id: 'race',
  title: 'RACE',
  blurb: 'LEFT AND RIGHT TO DODGE',
  era: 'lcd',
  layout: 'grid',
  lives: 3,
  create(session) {
    let lane = 1;
    let cars = [];
    let tick = 0;
    let spawn = 0.85;
    let dist = 0;
    let clock = 0;
    const iframes = createIFrames(1.6);

    function body(y) {
      return { top: y, bottom: y + 2 };
    }

    function overlaps(car) {
      if (car.lane !== lane) return false;
      const carBody = body(car.y);
      return carBody.bottom >= 16 && carBody.top <= 18;
    }

    return {
      update(dt, input) {
        if (session.dead) {
          session.engine(0);
          return;
        }
        iframes.tick(dt);
        clock += dt;
        const pace = Math.max(TUNING.race.minTick, TUNING.race.tick - (session.level - 1) * 0.028);
        session.engine(1.4 + session.level * 0.08);
        if (input.pressed('left') && lane > 0) {
          lane -= 1;
          session.sfx('move');
        } else if (input.pressed('right') && lane < 2) {
          lane += 1;
          session.sfx('move');
        }
        tick += dt;
        spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(0.5, TUNING.race.spawn - (session.level - 1) * 0.07) + Math.random() * 0.2;
          const danger = cars.some((car) => car.y > 4);
          if (!danger) {
            let choices = [0, 1, 2].filter((index) => !cars.some((car) => car.lane === index));
            if (clock < 8) choices = choices.filter((index) => index !== lane);
            if (!choices.length) choices = [0, 1, 2].filter((index) => index !== lane);
            const next = choices[Math.floor(Math.random() * choices.length)];
            cars.push({ lane: next, y: -3 });
          }
        }
        if (tick >= pace) {
          tick = 0;
          cars.forEach((car) => { car.y += 1; });
          dist += 1;
          if (dist % 3 === 0) session.addScore(10, true);
          if (dist % 18 === 0) session.sfx('score');
          if (dist % 70 === 0) session.setLevel(session.level + 1);
        }
        const hit = cars.find(overlaps);
        if (hit && !iframes.on()) {
          session.loseLife('crash');
          iframes.trigger();
          cars = cars.filter((car) => car.lane !== lane);
          if (session.dead) session.engine(0);
        }
        cars = cars.filter((car) => {
          if (car.y < 20) return true;
          session.addScore(15, true);
          return false;
        });
      },
      draw(gfx) {
        for (let y = 1; y < 20; y += 4) {
          gfx.plot(3, y, true);
          gfx.plot(6, y, true);
        }
        const drawCar = (laneIndex, y, yours) => {
          const x = LANES[laneIndex];
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
              if (yours && row === 0 && col === 1) continue;
              gfx.plot(x + col, y + row, true);
            }
          }
        };
        for (const car of cars) drawCar(car.lane, car.y, false);
        if (iframes.visible()) drawCar(lane, 16, true);
      },
      destroy() {
        session.engine(0);
      },
    };
  },
};
