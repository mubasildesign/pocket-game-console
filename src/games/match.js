function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = list[i];
    list[i] = list[j];
    list[j] = swap;
  }
  return list;
}

function deal() {
  const faces = shuffle(['A', 'A', 'B', 'B', 'C', 'C']);
  return faces.map((face) => ({ face, up: false, done: false }));
}

export const match = {
  id: 'match',
  title: 'MATCH',
  blurb: 'FLIP THE PAIRS',
  era: 'lcd',
  layout: 'grid',
  group: 'arcade',
  lives: 3,
  create(session) {
    let cards = deal();
    let cursor = 0;
    let open = [];
    let lock = 0;
    let clock = 90;

    function spot(index) {
      return { x: 1 + (index % 3) * 3, y: 6 + Math.floor(index / 3) * 6 };
    }

    function stamp(gfx, face, x, y) {
      if (face === 'A') {
        gfx.plot(x, y, true);
        gfx.plot(x + 1, y, true);
        gfx.plot(x, y + 1, true);
        gfx.plot(x + 1, y + 1, true);
      } else if (face === 'B') {
        gfx.plot(x, y + 1, true);
        gfx.plot(x + 1, y, true);
        gfx.plot(x + 1, y + 1, true);
        gfx.plot(x + 1, y + 2, true);
      } else {
        gfx.plot(x, y, true);
        gfx.plot(x + 1, y + 2, true);
      }
    }

    return {
      update(dt, input) {
        if (session.dead) return;
        clock -= dt;
        if (clock <= 0) {
          session.loseLife('hit');
          clock = Math.max(50, 75 - (session.level - 1) * 3);
          return;
        }
        if (lock > 0) {
          lock -= dt;
          if (lock <= 0 && open.length === 2) {
            const [a, b] = open;
            if (cards[a].face === cards[b].face) {
              cards[a].done = true;
              cards[b].done = true;
              session.addScore(80);
              session.sfx('clear');
              if (cards.every((card) => card.done)) {
                clears += 1;
                session.setLevel(session.level + 1);
                cards = deal();
                open = [];
                cursor = 0;
                clock = Math.max(50, 90 - (session.level - 1) * 3);
              }
            } else {
              cards[a].up = false;
              cards[b].up = false;
            }
            open = [];
          }
          return;
        }
        if (input.pressed('left') && cursor % 3 !== 0) cursor -= 1;
        if (input.pressed('right') && cursor % 3 !== 2) cursor += 1;
        if (input.pressed('up') && cursor >= 3) cursor -= 3;
        if (input.pressed('down') && cursor < 3) cursor += 3;
        if (input.pressed('rotate') || input.pressed('confirm')) {
          const card = cards[cursor];
          if (!card || card.done || card.up) return;
          card.up = true;
          open.push(cursor);
          session.sfx('move');
          if (open.length === 2) lock = 0.75;
        }
      },
      draw(gfx) {
        cards.forEach((card, index) => {
          const { x, y } = spot(index);
          gfx.plot(x, y, true);
          gfx.plot(x + 1, y, true);
          gfx.plot(x, y + 2, true);
          gfx.plot(x + 1, y + 2, true);
          if (card.up || card.done) stamp(gfx, card.face, x, y);
          if (index === cursor && Math.floor(gfx.time * 5) % 2 === 0) gfx.plot(x - 1, y + 1, true);
        });
        const left = Math.max(0, Math.round((clock / 90) * 10));
        for (let i = 0; i < left; i++) gfx.plot(i, 18, true);
      },
    };
  },
};
