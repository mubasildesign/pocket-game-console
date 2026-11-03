const KEY = 'pocket-grid-board-v2';
const NAME_KEY = 'pocket-grid-name';
const SEED = [];

function loadExtra() {
  try {
    const extra = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(extra) ? extra : [];
  } catch {
    return [];
  }
}

export function createBoard() {
  const nameInput = document.getElementById('player-name');
  const list = document.getElementById('ranks');
  nameInput.value = localStorage.getItem(NAME_KEY) || '';
  nameInput.addEventListener('input', () => {
    localStorage.setItem(NAME_KEY, nameInput.value.slice(0, 10));
  });

  function playerName() {
    return (nameInput.value.trim() || 'PLAYER').slice(0, 10).toUpperCase();
  }

  function render() {
    const extra = loadExtra();
    const ranked = [...SEED, ...extra].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const top = ranked.slice(0, 24);
    const latest = extra[extra.length - 1];
    const shown = latest && !top.includes(latest) ? top.slice(0, 23).concat(latest) : top;
    if (!shown.length) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'No scores yet. Play a game.';
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(
      ...shown.map((row, index) => {
        const item = document.createElement('li');
        if (row.you) item.className = 'you';
        const rank = document.createElement('span');
        rank.className = 'rank';
        rank.textContent = String(index + 1).padStart(2, '0');
        const who = document.createElement('span');
        who.className = 'who';
        who.textContent = row.name;
        const cart = document.createElement('span');
        cart.className = 'cart';
        cart.textContent = row.game;
        const pts = document.createElement('span');
        pts.className = 'pts';
        pts.textContent = String(row.score);
        item.append(rank, who, cart, pts);
        return item;
      }),
    );
  }

  function push({ game, score }) {
    const entry = { name: playerName(), game, score, you: true, at: Date.now() };
    const extra = loadExtra();
    extra.push(entry);
    localStorage.setItem(KEY, JSON.stringify(extra.slice(-40)));
    localStorage.setItem(NAME_KEY, nameInput.value.slice(0, 10));
    render();
  }

  render();
  return {
    push,
    focusName() {
      if (!nameInput.value.trim()) nameInput.focus();
    },
  };
}
