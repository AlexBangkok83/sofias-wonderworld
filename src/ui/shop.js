import { el, thingThumb } from './dom.js';
import { packThings } from '../art/things.js';
import { packLooks } from '../art/person.js';
import { sfx } from './sfx.js';

/**
 * The shop. One card per pack, each with a single button:
 *
 *   Buy        — there's enough in the piggy bank. Press it and it's hers.
 *   Not yet 🌙 — there isn't, yet. Pressing it just says to come back.
 *   Yours ✓    — already bought.
 *
 * This panel is never told how much money there is or what anything costs —
 * only which of those three a pack is (shopView() in src/shop/piggybank.js).
 * So there's no number for it to show even by accident.
 */
export class ShopPanel {
  constructor({ onBuy, onClose }) {
    this.onBuy = onBuy;
    this.onClose = onClose;
    this.view = [];
    this._build();
  }

  _build() {
    this.grid = el('div', { class: 'packs' });
    this.revealEl = el('div', { class: 'shop-reveal', hidden: true });
    this.root = el('div', { id: 'shop', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card shop-card' },
        el('div', { class: 'shop-head' },
          el('div', {},
            el('h2', {}, '🛍 Shop'),
            el('p', { class: 'sub' }, 'New things for your village. Come back every day!')),
          el('button', {
            class: 'btn secondary small', onclick: () => this.onClose(),
          }, 'Done')),
        this.grid),
      this.revealEl);
  }

  get isOpen() {
    return !this.root.hidden;
  }

  get revealOpen() {
    return !this.revealEl.hidden;
  }

  open(view) {
    this.root.hidden = false;
    this.closeReveal();
    this.refresh(view);
    this.grid.scrollTop = 0;
  }

  close() {
    this.root.hidden = true;
    this.closeReveal();
  }

  /** Redraw every card from a fresh shopView(). */
  refresh(view) {
    this.view = view;
    this.grid.replaceChildren(...view.map(({ pack, status }) => this._card(pack, status)));
  }

  _card(pack, status) {
    const note = el('div', { class: 'pack-note' });
    let button;
    if (status === 'owned') {
      button = el('button', { class: 'btn small owned', disabled: true }, 'Yours ✓');
    } else if (status === 'buy') {
      button = el('button', {
        class: 'btn buy', onclick: () => this.onBuy(pack.id),
      }, 'Buy');
    } else {
      button = el('button', {
        class: 'btn secondary not-yet',
        onclick: () => {
          note.textContent = 'Not yet — come back another day 🌙';
          card.classList.remove('shake');
          void card.offsetWidth;   // restart the animation
          card.classList.add('shake');
        },
      }, 'Not yet 🌙');
    }

    const card = el('div', {
      class: `pack-card ${status}`, 'data-pack': pack.id, 'data-status': status,
    },
    el('div', { class: 'pack-art', style: `--pack:${pack.color}` },
      el('span', { class: 'pack-emoji' }, pack.emoji)),
    el('div', { class: 'pack-body' },
      el('h3', {}, pack.name),
      el('p', {}, pack.blurb),
      this._contents(pack.id)),
    note,
    button);
    return card;
  }

  /** Little pictures of what's inside: things, then dress-up chips. */
  _contents(packId, big = false) {
    const things = packThings(packId).map((def) => (big
      ? el('span', { class: 'pack-item' }, thingThumb(def), el('span', {}, def.label))
      : thingThumb(def)));
    const looks = packLooks(packId).map((look) => {
      if (look.kind === 'Hair colour') {
        const hex = `#${look.color.toString(16).padStart(6, '0')}`;
        return el('span', { class: 'pack-look' },
          el('span', { class: 'pack-dot', style: `background:${hex}` }),
          `${capitalise(look.id)} hair`);
      }
      return el('span', { class: 'pack-look' }, look.label);
    });
    return el('div', { class: `pack-items${big ? ' big' : ''}` }, things, looks);
  }

  /** The moment after pressing Buy: pop the pack open and show what's inside. */
  reveal(packId) {
    const entry = this.view.find((v) => v.pack.id === packId);
    if (!entry) return;
    const { pack } = entry;
    const hasThings = packThings(pack.id).length > 0;
    const hasLooks = packLooks(pack.id).length > 0;

    const where = [];
    if (hasThings) {
      where.push(el('p', {}, 'Find them in the ', el('b', {}, '🧸 toy box'), ' — drag them in anywhere.'));
    }
    if (hasLooks) {
      where.push(el('p', {}, 'Try them on in ', el('b', {}, 'Characters'), '.'));
    }

    const confetti = el('div', { class: 'confetti' });
    const colours = ['#f0c05a', '#e08aa4', '#9ad9c0', '#b79ce0', '#8fb6dd', '#f28cb1'];
    for (let i = 0; i < 36; i++) {
      const bit = el('i');
      bit.style.left = `${(i * 37) % 100}%`;
      bit.style.background = colours[i % colours.length];
      bit.style.animationDelay = `${(i % 9) * 0.05}s`;
      bit.style.setProperty('--drift', `${((i * 53) % 120) - 60}px`);
      confetti.append(bit);
    }

    this.revealEl.replaceChildren(
      confetti,
      el('div', { class: 'panel reveal-card' },
        el('div', { class: 'reveal-art', style: `--pack:${pack.color}` },
          el('span', { class: 'pack-emoji' }, pack.emoji)),
        el('h2', {}, "It's yours!"),
        el('div', { class: 'reveal-name' }, pack.name),
        this._contents(pack.id, true),
        el('div', { class: 'reveal-where' }, where),
        el('button', { class: 'btn', onclick: () => this.closeReveal() }, 'Yay!')),
    );
    this.revealEl.hidden = false;
    sfx('tada');
  }

  closeReveal() {
    this.revealEl.hidden = true;
    this.revealEl.replaceChildren();
  }
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
