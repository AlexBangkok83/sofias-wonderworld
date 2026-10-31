import { el } from './dom.js';
import { svg } from '../art/kit.js';
import { packThings, drawThing } from '../art/things.js';
import { packLooks, drawPerson } from '../art/person.js';
import { sfx } from './sfx.js';

/**
 * The shop: a whole screen, like walking into a toy shop.
 *
 *   the shelf    — every pack as a big box with what's inside drawn on the
 *                  front, and a tag: Buy, Not yet 🌙, or Yours ✓
 *   a pack       — tap a box and it opens up big: everything in it, and one
 *                  big button
 *   unboxing     — press Buy and the box wobbles, the lid pops off and the
 *                  things jump out one at a time
 *
 * This screen is never told how much money there is or what anything costs —
 * only which of those three a pack is (shopView() in src/shop/piggybank.js).
 * So there's no number for it to show even by accident.
 */

const TAGS = { buy: 'Buy', 'not-yet': 'Not yet 🌙', owned: 'Yours ✓' };

// People modelling the hairstyles and extras on the boxes.
const MODELS = [
  { skin: 'light', hair: 'short', hairColor: 'brown', outfit: 'tee', shirt: 'rose', pants: 'navy', shoes: 'brown' },
  { skin: 'brown', hair: 'curly', hairColor: 'black', outfit: 'dress', shirt: 'yellow', pants: 'navy', shoes: 'white' },
  { skin: 'tan', hair: 'bob', hairColor: 'ginger', outfit: 'shorts', shirt: 'mint', pants: 'blue', shoes: 'brown' },
  { skin: 'porcelain', hair: 'long', hairColor: 'blonde', outfit: 'dress', shirt: 'lilac', pants: 'navy', shoes: 'purple' },
  { skin: 'deep', hair: 'buns', hairColor: 'black', outfit: 'tee', shirt: 'teal', pants: 'brown', shoes: 'black' },
];

/** Everything in a pack, as pictures: { label, svg, w, h } in drawing units. */
function packPictures(packId) {
  const things = packThings(packId).map((def) => ({
    label: def.label,
    w: def.w,
    h: def.h,
    svg: svg(def.w, def.h, drawThing(def, def.toggle ? { on: true } : {}, `shop-${packId}-${def.id}`)),
  }));
  const looks = packLooks(packId).map((look, i) => {
    const model = { ...MODELS[i % MODELS.length], accessory: 'none', accessoryColor: 'rose' };
    let label = look.label;
    if (look.kind === 'Hairstyle') model.hair = look.id;
    if (look.kind === 'Hair colour') {
      model.hair = 'long';
      model.hairColor = look.id;
      label = `${look.id.charAt(0).toUpperCase()}${look.id.slice(1)} hair`;
    }
    if (look.kind === 'Extra') model.accessory = look.id;
    const person = drawPerson(model, { mood: 'happy' }).replace(/viewBox="[^"]*"/, 'viewBox="-70 -215 140 225"');
    return { label, w: 140, h: 225, svg: person };
  });
  return [...things, ...looks];
}

/** Nest one picture inside a bigger SVG, fitted into a box and standing on its bottom edge. */
function placed(picture, x, y, w, h) {
  return picture.svg
    .replace(/ width="[^"]*" height="[^"]*"/, '')
    .replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet" `);
}

/**
 * The front of a box: up to five of the things inside, the first one big in
 * the middle and the rest stepping down either side, all on one shelf line.
 */
function collage(packId, { width = 300, height = 320, max = 5 } = {}) {
  const pictures = packPictures(packId).slice(0, max);
  const n = pictures.length;
  const order = [];                                   // middle first, then out
  for (let i = 0; i < n; i++) order.push(i % 2 ? Math.floor(n / 2) - Math.ceil(i / 2) : Math.floor(n / 2) + i / 2);
  const columns = width / n;
  let out = '';
  // Draw from the edges in, so the big middle one is in front.
  const byDepth = pictures.map((p, i) => ({ p, slot: order[i], rank: i })).sort((a, b) => b.rank - a.rank);
  for (const { p, slot, rank } of byDepth) {
    const scale = rank === 0 ? 1 : rank < 3 ? 0.82 : 0.68;
    const w = Math.min(columns * 1.7, width * 0.6) * scale;
    const h = height * 0.86 * scale;
    out += placed(p, slot * columns + columns / 2 - w / 2, height - 8 - h, w, h);
  }
  // Stand on the bottom of whatever window it's shown in.
  return svg(width, height, out).replace('<svg ', '<svg preserveAspectRatio="xMidYMax meet" ');
}

export class ShopPanel {
  constructor({ onBuy, onClose }) {
    this.onBuy = onBuy;
    this.onClose = onClose;
    this.view = [];
    this.openPack = null;
    this._build();
  }

  _build() {
    this.shelf = el('div', { class: 'shelf' });
    this.shelf.addEventListener('wheel', (e) => {
      // A mouse wheel slides the shelf along, the way a finger does.
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        this.shelf.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
    this.detailEl = el('div', { class: 'pack-detail', hidden: true });
    this.revealEl = el('div', { class: 'shop-reveal', hidden: true });

    this.root = el('div', { id: 'shop', hidden: true },
      el('div', { class: 'awning' }),
      el('div', { class: 'shop-sign' }, el('span', {}, '🛍'), 'Shop'),
      el('button', {
        class: 'icon-btn shop-close', 'aria-label': 'Leave the shop', title: 'Leave the shop',
        onclick: () => this.onClose(),
      }, '✕'),
      el('p', { class: 'shop-sub' }, 'New things for your village. Come back every day!'),
      this.shelf,
      el('div', { class: 'shop-floor' }),
      this.detailEl,
      this.revealEl);
  }

  get isOpen() {
    return !this.root.hidden;
  }

  get revealOpen() {
    return !this.revealEl.hidden;
  }

  get detailOpen() {
    return !this.detailEl.hidden;
  }

  open(view) {
    this.root.hidden = false;
    this.closeReveal();
    this.closePack();
    this.refresh(view);
    this.shelf.scrollLeft = 0;
  }

  close() {
    this.root.hidden = true;
    this.closeReveal();
    this.closePack();
  }

  /** Escape, or the back button: unboxing → shelf, a pack → shelf. False if already on the shelf. */
  back() {
    if (this.revealOpen) { this.closeReveal(); return true; }
    if (this.detailOpen) { this.closePack(); return true; }
    return false;
  }

  /** Redraw from a fresh shopView(). */
  refresh(view) {
    this.view = view;
    const scroll = this.shelf.scrollLeft;
    this.shelf.replaceChildren(...view.map(({ pack, status }) => this._box(pack, status)));
    this.shelf.scrollLeft = scroll;
    if (this.openPack) this._renderDetail();
  }

  // ------------------------------------------------------------------
  // The shelf
  // ------------------------------------------------------------------

  _box(pack, status) {
    return el('button', {
      class: `pack-box ${status}`,
      'data-pack': pack.id,
      'data-status': status,
      style: `--pack:${pack.color}`,
      'aria-label': `${pack.name}: ${TAGS[status]}`,
      onclick: () => this.showPack(pack.id),
    },
    el('span', { class: 'box-lid' }),
    el('span', { class: 'box-body' },
      el('span', { class: 'box-window', html: collage(pack.id) }),
      el('span', { class: 'box-label' }, el('span', { class: 'emoji' }, pack.emoji), pack.name)),
    el('span', { class: `box-tag ${status}` }, TAGS[status]));
  }

  // ------------------------------------------------------------------
  // One pack, up close
  // ------------------------------------------------------------------

  showPack(packId) {
    this.openPack = packId;
    this._renderDetail();
    this.detailEl.hidden = false;
    sfx('pop');
  }

  closePack() {
    this.openPack = null;
    this.detailEl.hidden = true;
    this.detailEl.replaceChildren();
  }

  _renderDetail() {
    const entry = this.view.find((v) => v.pack.id === this.openPack);
    if (!entry) return;
    const { pack, status } = entry;
    const pictures = packPictures(pack.id);
    const note = el('p', { class: 'pack-note' });

    let button;
    if (status === 'buy') {
      button = el('button', { class: 'btn big buy', onclick: () => this.onBuy(pack.id) }, 'Buy');
    } else if (status === 'not-yet') {
      button = el('button', {
        class: 'btn big secondary not-yet',
        onclick: () => {
          note.textContent = 'Not yet — come back another day 🌙';
          card.classList.remove('shake');
          void card.offsetWidth;   // restart the animation
          card.classList.add('shake');
          sfx('tick');
        },
      }, 'Not yet 🌙');
    } else {
      button = el('button', { class: 'btn big owned', disabled: true }, 'Yours ✓');
    }

    const card = el('div', { class: 'detail-card', style: `--pack:${pack.color}` },
      el('div', { class: 'detail-stage', html: collage(pack.id, { width: 520, height: 260, max: 8 }) }),
      el('div', { class: 'detail-info' },
        el('h2', {}, el('span', { class: 'emoji' }, pack.emoji), pack.name),
        el('p', { class: 'blurb' }, pack.blurb),
        el('div', { class: 'inside' }, pictures.map((p) => el('span', { class: 'inside-item' },
          el('span', { class: 'thumb', html: placedThumb(p) }),
          el('span', { class: 'label' }, p.label)))),
        note,
        button));

    this.detailEl.replaceChildren(
      el('button', { class: 'btn secondary small detail-back', onclick: () => this.closePack() }, '‹ Back to the shop'),
      card,
    );
  }

  // ------------------------------------------------------------------
  // Unboxing
  // ------------------------------------------------------------------

  /** The moment after pressing Buy: the box opens and everything jumps out. */
  reveal(packId) {
    const entry = this.view.find((v) => v.pack.id === packId);
    if (!entry) return;
    const { pack } = entry;
    const pictures = packPictures(pack.id);
    const hasThings = packThings(pack.id).length > 0;

    const confetti = el('div', { class: 'confetti' });
    const colours = ['#f0c05a', '#e08aa4', '#9ad9c0', '#b79ce0', '#8fb6dd', '#f28cb1'];
    for (let i = 0; i < 40; i++) {
      const bit = el('i');
      bit.style.left = `${(i * 37) % 100}%`;
      bit.style.background = colours[i % colours.length];
      bit.style.animationDelay = `${0.7 + (i % 9) * 0.05}s`;
      bit.style.setProperty('--drift', `${((i * 53) % 120) - 60}px`);
      confetti.append(bit);
    }

    const items = el('div', { class: 'unbox-items' }, pictures.map((p, i) => el('span', {
      class: 'unbox-item', style: `animation-delay:${0.85 + i * 0.16}s`,
    }, el('span', { class: 'thumb', html: placedThumb(p) }), el('span', { class: 'label' }, p.label))));

    this.revealEl.replaceChildren(
      confetti,
      el('div', { class: 'unbox', style: `--pack:${pack.color}` },
        items,
        el('div', { class: 'unbox-box' },
          el('span', { class: 'box-lid' }),
          el('span', { class: 'box-body' },
            el('span', { class: 'box-label' }, el('span', { class: 'emoji' }, pack.emoji), pack.name))),
        el('h2', {}, "It's yours!"),
        el('p', { class: 'reveal-where' }, hasThings
          ? 'They’re waiting in the 🧸 toy box.'
          : 'Try them on in Characters.'),
        el('div', { class: 'reveal-actions' },
          el('button', { class: 'btn big play', onclick: () => this.onClose() }, 'Play with them!'),
          el('button', { class: 'btn secondary keep', onclick: () => this.closeReveal() }, 'Keep shopping'))),
    );
    this.closePack();
    this.revealEl.hidden = false;
    sfx('tada');
    pictures.forEach((_, i) => setTimeout(() => sfx('pop'), 850 + i * 160));
  }

  closeReveal() {
    this.revealEl.hidden = true;
    this.revealEl.replaceChildren();
  }
}

/** A single picture sized to fill a square thumbnail. */
function placedThumb(picture) {
  const pad = 10;
  const side = Math.max(picture.w, picture.h) + pad * 2;
  return svg(side, side, placed(picture, (side - picture.w) / 2, side - pad - picture.h, picture.w, picture.h));
}
