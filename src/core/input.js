const KEY = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  z: 'rotate',
  Z: 'rotate',
  x: 'rotate',
  X: 'rotate',
  ' ': 'rotate',
  Enter: 'confirm',
  Escape: 'back',
  m: 'mute',
  M: 'mute',
  r: 'reset',
  R: 'reset',
  p: 'power',
  P: 'power',
};

const MAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'rotate',
  KeyX: 'rotate',
  Space: 'rotate',
  Enter: 'confirm',
  Escape: 'back',
  KeyM: 'mute',
  KeyR: 'reset',
  KeyP: 'power',
};

export function createInput(canvas, root) {
  const held = new Set();
  const pressed = new Set();
  const releaseAfter = new Set();
  let taps = [];
  let pointer = null;
  let clicked = false;

  function virtualDown(name) {
    if (!held.has(name)) pressed.add(name);
    held.add(name);
  }

  function virtualUp(name) {
    held.delete(name);
  }

  function actionFrom(e) {
    return MAP[e.code] || KEY[e.key];
  }

  function onKeyDown(e) {
    if (e.target && e.target.closest && e.target.closest('input, textarea')) {
      if (e.key === 'Enter') e.target.blur();
      return;
    }
    const name = actionFrom(e);
    if (!name) return;
    e.preventDefault();
    if (e.repeat) return;
    virtualDown(name);
  }

  function onKeyUp(e) {
    const name = actionFrom(e);
    if (!name) return;
    e.preventDefault();
    virtualUp(name);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  window.addEventListener('blur', () => {
    held.clear();
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
    clicked = true;
  });

  root.querySelectorAll('[data-act]').forEach((btn) => {
    const name = btn.dataset.act;
    const down = (e) => {
      e.preventDefault();
      virtualDown(name);
    };
    const up = () => virtualUp(name);
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  });

  return {
    held: (name) => held.has(name),
    pressed: (name) => pressed.has(name),
    consume(name) {
      if (!pressed.has(name)) return false;
      pressed.delete(name);
      return true;
    },
    anyPressed() {
      return pressed.size > 0;
    },
    clicked() {
      return clicked;
    },
    pointer() {
      return pointer;
    },
    tap(name) {
      taps.push(name);
    },
    flushTaps() {
      for (const name of taps) {
        const was = held.has(name);
        if (!was) pressed.add(name);
        held.add(name);
        if (!was) releaseAfter.add(name);
      }
      taps = [];
    },
    swallow() {
      pressed.clear();
      clicked = false;
      pointer = null;
    },
    endFrame() {
      for (const name of releaseAfter) held.delete(name);
      releaseAfter.clear();
      pressed.clear();
      clicked = false;
      pointer = null;
    },
  };
}
