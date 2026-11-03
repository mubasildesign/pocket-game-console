import { MOTIF, PALETTE, SCREEN, SPECTACLE } from '../core/constants.js';
import { pad, readBest, writeBest } from '../games/kit.js';
import { drawIcon } from './icons.js';

export function createFlow({ audio, display, screens, games, announce, setLabel, onScore }) {
  const classics = games.filter((game) => game.group !== 'arcade');
  const arcade = games.filter((game) => game.group === 'arcade');
  let shelf = 0;
  let index = 0;
  const hits = [];
  const shelfHits = [];
  let run = null;

  const shelfList = () => (shelf === 0 ? classics : arcade);

  function motifOf(game) {
    return { era: game.era, motif: MOTIF[game.id] || 1 };
  }

  function makeSession(game) {
    const opts = motifOf(game);
    let lastSlam = 0;
    const session = {
      score: 0,
      lives: game.lives ?? 3,
      level: 1,
      dead: false,
      maxLives: game.lives ?? 3,
      addScore(n, silent = false) {
        session.score += n;
        if (!silent) audio.play('score', opts);
        if (game.era === 'glass' && !silent) display.pulse(game.accent || PALETTE.cyan);
      },
      loseLife(cue = 'hit') {
        if (session.dead) return;
        session.lives -= 1;
        const dead = session.lives <= 0;
        audio.play(dead ? 'over' : cue, opts);
        display.shake(game.era === 'glass' ? SPECTACLE.SHAKE_GLASS : SPECTACLE.SHAKE_LCD);
        display.flash(game.era === 'glass' ? 0.5 : 0.22);
        if (dead) {
          session.dead = true;
          audio.engine(0);
        }
      },
      setLevel(n) {
        if (n === session.level) return;
        session.level = n;
        audio.play('level', opts);
      },
      sfx(name) { audio.play(name, opts); },
      engine(hz) { audio.engine(hz); },
      shake(amount) { display.shake(amount); },
      burst(x, y, color) { display.burst(x, y, color); },
      combo(n) {
        if (n < lastSlam) lastSlam = 0;
        if (SPECTACLE.SLAM_AT.includes(n) && n !== lastSlam) {
          lastSlam = n;
          display.slam(SPECTACLE.SLAM_LABELS[n]);
          display.shake(SPECTACLE.SHAKE_GLASS);
          audio.play('level', opts);
        }
      },
    };
    return session;
  }

  function drawHud(gfx, game, session, hintT) {
    const color = game.era === 'glass' ? (game.accent || PALETTE.cyan) : PALETTE.hud;
    gfx.text('SCORE', 8, 4, color, 1);
    gfx.text(pad(session.score, 6), 8, 16, color, 2);
    gfx.text(`LV ${pad(session.level, 2)}`, 128, 16, color, 2);
    const slots = session.maxLives;
    for (let i = 0; i < slots; i++) {
      const x = SCREEN.W - 16 - (slots - i) * 16;
      gfx.rect(x, 16, 12, 12, i < session.lives ? color : 'rgba(0,0,0,0.18)');
    }
    gfx.text(hintT > 0 ? game.blurb : game.title, 8, 34, color, 1);
  }

  function stopRun() {
    run?.inst?.destroy?.();
    audio.engine(0);
    run = null;
  }

  function makePlay(game) {
    let session;
    let inst;
    let hintT = 0;
    let sawDeath = false;
    let climb = 0;
    const screen = {
      id: 'play',
      game,
      backdrop: () => (game.layout === 'grid' ? 'lcd-grid' : game.era === 'glass' ? 'glass' : 'lcd'),
      enter() {
        stopRun();
        session = makeSession(game);
        inst = game.create(session);
        run = { game, session, inst, screen };
        hintT = SPECTACLE.HINT_SECONDS;
        sawDeath = false;
        climb = 0;
        if (game.era === 'glass') {
          display.flash(0.7);
          display.slam(game.title);
          display.shake(4);
        } else {
          display.flash(0.2);
        }
        audio.play('confirm', motifOf(game));
        setLabel(`${game.title}. ${game.blurb}`);
        announce(`${game.title}. ${game.blurb}`);
      },
      update(dt, input) {
        if (input.consume('back')) {
          audio.play('pause', motifOf(game));
          screens.push(makePause());
          return;
        }
        if (input.consume('reset')) {
          screen.enter();
          return;
        }
        hintT = Math.max(0, hintT - dt);
        climb += dt;
        if (climb >= 15 && session.level < 12) {
          climb = 0;
          session.setLevel(session.level + 1);
        }
        inst.update(dt, input);
        if (session.dead && !sawDeath) {
          sawDeath = true;
          audio.engine(0);
          screens.push(makeOver());
        }
      },
      draw(gfx) {
        inst?.draw(gfx);
        if (session) drawHud(gfx, game, session, hintT);
      },
      exit() {
        if (run?.screen === screen) stopRun();
      },
    };
    return screen;
  }

  function makePause() {
    let focus = 0;
    const game = run.game;
    return {
      id: 'pause',
      backdrop: () => (game.layout === 'grid' ? 'lcd-grid' : game.era === 'glass' ? 'glass' : 'lcd'),
      enter() {
        setLabel(`Paused. ${game.title}`);
        announce(`Paused ${game.title}`);
      },
      update(dt, input) {
        if (input.pressed('up') || input.pressed('down')) {
          focus = focus ? 0 : 1;
          audio.play('menu');
        }
        if (input.consume('reset')) {
          screens.pop();
          screens.pop();
          screens.push(makePlay(game));
          return;
        }
        const go = input.pressed('confirm') || input.pressed('rotate');
        if (input.consume('back') || (go && focus === 0)) {
          screens.pop();
          return;
        }
        if (go && focus === 1) {
          screens.pop();
          screens.pop();
          audio.play('menu');
        }
      },
      draw(gfx) {
        run?.inst?.draw(gfx);
        if (run?.session) drawHud(gfx, game, run.session, 0);
        gfx.rect(0, 48, SCREEN.W, SCREEN.H - 48, 'rgba(12,18,14,0.62)');
        gfx.text('PAUSED', 78, 200, PALETTE.white, 3);
        gfx.text(focus === 0 ? '> RESUME' : '  RESUME', 70, 270, PALETTE.white, 2);
        gfx.text(focus === 1 ? '> MENU' : '  MENU', 70, 300, PALETTE.white, 2);
      },
    };
  }

  function makeOver() {
    let focus = 0;
    const game = run.game;
    const score = run.session.score;
    const best = writeBest(game.id, score);
    return {
      id: 'over',
      backdrop: () => (game.era === 'glass' ? 'glass' : 'lcd'),
      enter() {
        if (score > 0) onScore?.({ game: game.title, score });
        setLabel(`Game over. ${game.title}. Score ${score}`);
        announce(`Game over. ${game.title}. Score ${score}. Best ${best}`);
      },
      update(dt, input) {
        if (input.pressed('up') || input.pressed('down')) {
          focus = focus ? 0 : 1;
          audio.play('menu');
        }
        const go = input.pressed('confirm') || input.pressed('rotate');
        if (input.consume('reset') || (go && focus === 0)) {
          screens.pop();
          screens.pop();
          screens.push(makePlay(game));
          return;
        }
        if (input.consume('back') || (go && focus === 1)) {
          screens.pop();
          screens.pop();
          audio.play('menu');
        }
      },
      draw(gfx) {
        const color = game.era === 'glass' ? PALETTE.white : PALETTE.hud;
        gfx.text('GAME OVER', 48, 120, color, 3);
        gfx.text(game.title, 16, 180, color, 2);
        gfx.text('SCORE', 16, 230, color, 1);
        gfx.text(pad(score, 6), 16, 246, color, 3);
        gfx.text('BEST', 16, 310, color, 1);
        gfx.text(pad(best, 6), 16, 326, color, 2);
        gfx.text(focus === 0 ? '> RETRY' : '  RETRY', 16, 400, color, 2);
        gfx.text(focus === 1 ? '> MENU' : '  MENU', 16, 432, color, 2);
      },
    };
  }

  const menu = {
    id: 'menu',
    backdrop: () => 'lcd',
    enter() {
      setLabel('Cartridge menu');
      announce(shelf === 0 ? 'Classic shelf' : 'Arcade shelf');
    },
    update(dt, input) {
      const gamesNow = shelfList();
      if (input.pressed('left') || input.pressed('right')) {
        shelf = shelf === 0 ? 1 : 0;
        index = Math.min(index, shelfList().length - 1);
        audio.play('menu');
        announce(shelf === 0 ? 'Classic shelf' : 'Arcade shelf');
        return;
      }
      if (input.pressed('up')) {
        index = (index + gamesNow.length - 1) % gamesNow.length;
        audio.play('menu');
      } else if (input.pressed('down')) {
        index = (index + 1) % gamesNow.length;
        audio.play('menu');
      }
      const click = input.pointer();
      if (input.clicked() && click) {
        const tab = shelfHits.find((row) => click.x >= row.x && click.x <= row.x + row.w && click.y >= row.y && click.y <= row.y + row.h);
        if (tab) {
          if (tab.shelf !== shelf) {
            shelf = tab.shelf;
            index = 0;
            audio.play('menu');
            announce(shelf === 0 ? 'Classic shelf' : 'Arcade shelf');
          }
          return;
        }
        const hit = hits.find((row) => click.y >= row.y && click.y <= row.y + row.h);
        if (hit) {
          if (hit.i === index) screens.push(makePlay(gamesNow[index]));
          else {
            index = hit.i;
            audio.play('menu');
          }
          return;
        }
      }
      if (input.pressed('confirm') || input.pressed('rotate')) {
        screens.push(makePlay(gamesNow[index]));
      }
      if (input.consume('reset')) {
        shelf = 0;
        index = 0;
        audio.play('menu');
      }
    },
    draw(gfx) {
      const gamesNow = shelfList();
      const color = PALETTE.hud;
      if (shelf === 1) gfx.rect(0, 0, SCREEN.W, SCREEN.H, 'rgba(18, 72, 92, 0.16)');
      gfx.text(shelf === 0 ? 'CLASSIC' : 'ARCADE', 16, 16, color, 2);
      const count = `${pad(index + 1, 2)}/${pad(gamesNow.length, 2)}`;
      const now = new Date();
      const hour = now.getHours() % 12 || 12;
      const time = `${hour}:${String(now.getMinutes()).padStart(2, '0')}`;
      const timeW = gfx.textWidth(time, 2);
      const countW = gfx.textWidth(count, 2);
      const right = SCREEN.W - 10;
      gfx.text(count, right - timeW - 12 - countW, 16, color, 2);
      gfx.text(time, right - timeW, 16, color, 2);
      const start = Math.max(0, Math.min(index - 1, gamesNow.length - 4));
      hits.length = 0;
      for (let row = 0; row < 4; row++) {
        const game = gamesNow[start + row];
        if (!game) break;
        const y = 72 + row * 84;
        const on = start + row === index;
        if (on) gfx.rect(12, y - 10, 276, 68, 'rgba(28,39,24,0.14)');
        drawIcon(gfx, game.id, 22, y, color, 5);
        const cursor = on && Math.floor(gfx.time * 3) % 2 === 0 ? '>' : ' ';
        gfx.text(`${cursor}${game.title}`, 78, y + 10, color, 3);
        hits.push({ y: y - 10, h: 68, i: start + row });
      }
      const focus = gamesNow[index];
      gfx.text(focus.blurb, 16, 418, color, 1);
      gfx.text('Z START', 16, 444, color, 1);
      shelfHits.length = 0;
      const tabs = [
        { label: 'CLASSIC', shelf: 0, x: 12 },
        { label: 'ARCADE', shelf: 1, x: 156 },
      ];
      for (const tab of tabs) {
        const on = shelf === tab.shelf;
        gfx.rect(tab.x, 478, 132, 40, on ? color : 'rgba(28,39,24,0.12)');
        gfx.text(tab.label, tab.x + 14, 492, on ? PALETTE.lcdBg : color, 2);
        shelfHits.push({ x: tab.x, y: 478, w: 132, h: 40, shelf: tab.shelf });
      }
      const scan = (gfx.time * 36) % SCREEN.H;
      gfx.rect(0, scan, SCREEN.W, 2, 'rgba(28,39,24,0.07)');
    },
  };

  let bootT = 0;
  const boot = {
    id: 'boot',
    backdrop: () => 'lcd',
    enter() {
      bootT = 0;
      setLabel('Grid OS starting');
      announce('Grid OS starting');
    },
    update(dt, input) {
      bootT += dt;
      const skip = bootT > 0.4 && (input.pressed('confirm') || input.pressed('rotate') || input.pressed('back'));
      if (bootT > 2.5 || skip) screens.reset(menu);
    },
    draw(gfx) {
      const color = PALETTE.hud;
      gfx.text('GRID OS', 70, 150, color, 3);
      const count = bootT < 1.35 ? '9999' : pad(games.length, 4);
      gfx.text(count, 78, 230, color, 3);
      gfx.text(bootT < 1.35 ? 'CHECKING' : 'CARTRIDGES', 52, 290, color, 2);
      const blink = Math.floor(gfx.time * 8) % 2 === 0;
      if (blink) gfx.rect(40, 340, 220, 3, color);
    },
  };

  const off = {
    id: 'off',
    backdrop: () => 'off',
    enter() {
      setLabel('Pocket Grid is off. Press on.');
      announce('Pocket Grid is off');
    },
    update() {},
    draw(gfx) {
      if (Math.floor(gfx.time * 2) % 2 === 0) {
        gfx.text('PRESS ON', 58, 250, '#9fbf8a', 2);
      }
    },
  };

  return {
    off,
    boot,
    menu,
    shutdown: stopRun,
    start(id) {
      const game = games.find((item) => item.id === id);
      if (!game) return;
      screens.reset(menu);
      screens.push(makePlay(game));
    },
    info() {
      return {
        screen: screens.top()?.id || 'off',
        game: run?.game?.id || null,
        score: run?.session?.score ?? 0,
        lives: run?.session?.lives ?? 0,
        level: run?.session?.level ?? 1,
        dead: !!run?.session?.dead,
        shelf,
        index,
      };
    },
  };
}
