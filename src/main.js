import { createAudio } from './core/audio.js';
import { createDisplay } from './core/lcd.js';
import { createInput } from './core/input.js';
import { createScreens } from './core/screens.js';
import { ALL } from './games/registry.js';
import { createFlow } from './ui/flow.js';
import { createBoard } from './ui/board.js';

const canvas = document.getElementById('lcd');
const device = document.getElementById('device');
const desk = document.getElementById('desk');
const wrap = document.getElementById('desk-wrap');
const live = document.getElementById('live');
const boardEl = document.getElementById('board');
const burger = document.getElementById('burger');
const scrim = document.getElementById('scrim');
const boardClose = document.getElementById('board-close');
const board = createBoard();
const mobileQuery = window.matchMedia('(max-width: 900px)');

function setScores(open) {
  boardEl.classList.toggle('is-open', open);
  scrim.hidden = !open;
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

burger.addEventListener('click', () => setScores(!boardEl.classList.contains('is-open')));
scrim.addEventListener('click', () => setScores(false));
boardClose.addEventListener('click', () => setScores(false));

const input = createInput(canvas, document.body);
const audio = createAudio();
const display = createDisplay(canvas);
const screens = createScreens();

function announce(text) {
  live.textContent = text;
}

function setLabel(text) {
  canvas.setAttribute('aria-label', text);
}

const flow = createFlow({
  audio,
  display,
  screens,
  games: ALL,
  announce,
  setLabel,
  onScore: (entry) => board.push(entry),
});

screens.reset(flow.off);

function fit() {
  const mobile = mobileQuery.matches;
  if (mobile) {
    if (boardEl.parentElement !== document.body) document.body.append(boardEl);
    setScores(false);
  } else if (boardEl.parentElement !== desk) {
    desk.prepend(boardEl);
    setScores(false);
  }
  const width = mobile ? 360 : 786;
  const height = mobile ? 780 : 700;
  const availW = window.innerWidth - (mobile ? 8 : 24);
  const availH = window.innerHeight - (mobile ? 8 : 24);
  const scale = Math.max(0.38, Math.min(availW / width, availH / height, mobile ? 1.35 : 1.15)) * 0.92;
  wrap.style.setProperty('--s', scale.toFixed(3));
}

const nameGate = document.getElementById('name-gate');
const nameForm = document.getElementById('name-form');
const nick = document.getElementById('nick');
const nameInput = document.getElementById('player-name');
const picks = document.getElementById('name-picks');
const suggestions = ['KITE', 'NOVA', 'RIO', 'PIX', 'ACE', 'MOTH', 'JUNO', 'NIX']
  .sort(() => Math.random() - 0.5)
  .slice(0, 4);

for (const suggestion of suggestions) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.textContent = suggestion;
  chip.addEventListener('click', () => {
    nick.value = suggestion;
    nick.focus();
  });
  picks.append(chip);
}

function saveNickname(value) {
  const name = value.trim().slice(0, 10);
  if (!name) {
    nick.focus();
    return;
  }
  nameInput.value = name;
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameGate.hidden = true;
}

if (!nameInput.value.trim()) {
  nameGate.hidden = false;
  nick.focus();
}

nameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  saveNickname(nick.value);
});

fit();
window.addEventListener('resize', fit);

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  input.flushTaps();

  if (screens.top()?.id === 'off' && (input.anyPressed() || input.clicked())) {
    audio.unlock();
    audio.play('power');
    device.classList.add('is-on');
    input.swallow();
    if (nameGate.hidden) board.focusName();
    screens.reset(flow.boot);
  }

  let top = screens.top();
  if (top.id !== 'off' && input.consume('power')) {
    flow.shutdown();
    audio.engine(0);
    device.classList.remove('is-on');
    screens.reset(flow.off);
    top = screens.top();
  } else if (top.id !== 'off') {
    if (input.consume('mute')) {
      const muted = audio.toggle();
      announce(muted ? 'Sound off' : 'Sound on');
    }
    try {
      top.update(dt, input);
    } catch (error) {
      console.error(error);
      flow.shutdown();
      screens.reset(flow.menu);
    }
    top = screens.top();
  }

  audio.update(dt);
  display.begin(top.backdrop());
  try {
    top.draw(display.gfx);
  } catch (error) {
    console.error(error);
  }
  display.present(dt);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

window.__POCKET__ = {
  info: () => flow.info(),
  start(id) {
    device.classList.add('is-on');
    audio.unlock();
    flow.start(id);
  },
  tap: (name) => input.tap(name),
};
