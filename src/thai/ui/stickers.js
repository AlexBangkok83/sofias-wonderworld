/** The sticker book: earned stickers in colour, the rest waiting as shadows. */

import { h, deco, fmt } from '../core/dom.js';
import { STICKERS, SHINY_STICKERS } from '../data/deco.js';
import { S, nextSticker, STICKER_EVERY } from '../core/state.js';
import { statusBar, bottomNav } from './common.js';

export function stickersRoute(screen) {
  const owned = new Set(S().stickers);
  const next = nextSticker();
  const got = STICKERS.filter(([id]) => owned.has(id)).length + SHINY_STICKERS.filter(([id]) => owned.has(id)).length;

  const slot = ([id, emoji, name], shiny) => h('div', { class: `sticker ${owned.has(id) ? 'got' : 'missing'} ${shiny ? 'shiny' : ''}` },
    deco(emoji, 'sticker-img'),
    h('span', null, owned.has(id) ? name : '?'));

  screen.classList.add('stickers-screen');
  screen.append(
    statusBar(),
    h('main', { class: 'page' },
      h('h1', null, 'My stickers'),
      h('p', { class: 'lead' }, `${got} collected.`,
        next ? ` Next sticker at ${fmt(next.at)} points (you have ${fmt(S().lifetime)} all-time).` : ' You have them all!'),
      h('p', { class: 'hint' }, `A new sticker every ${STICKER_EVERY} points. Mistakes never take a sticker away.`),
      h('div', { class: 'sticker-grid' }, STICKERS.map((s) => slot(s, false))),
      h('h2', null, '✨ Shiny surprises'),
      h('p', { class: 'hint' }, 'These turn up by surprise after a perfect round.'),
      h('div', { class: 'sticker-grid' }, SHINY_STICKERS.map((s) => slot(s, true)))),
    bottomNav('/stickers'),
  );
  return null;
}
