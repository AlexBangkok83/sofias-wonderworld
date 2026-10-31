/** End of a round: stars, points, any new sticker or level, and what next. */

import { h, deco, fmt, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { sfx, say } from '../core/audio.js';
import { GREETINGS } from '../data/greetings.js';

export function showResults(screen, r) {
  screen.className = 'screen results-screen';
  const starRow = h('div', { class: 'result-stars' },
    [1, 2, 3].map((n) => deco(ICONS.star, `rstar ${n <= r.stars ? 'on' : 'off'} s${n}`)));

  const net = r.earned - r.lost;
  const lines = [
    h('div', { class: 'result-points' }, h('b', null, `${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))}`), ' points'),
    h('div', { class: 'result-breakdown' },
      h('span', { class: 'plus' }, `+${fmt(r.earned)} earned`),
      r.lost ? h('span', { class: 'minus' }, `−${fmt(r.lost)} for mistakes`) : null),
  ];

  const extras = [];
  if (r.perfect) extras.push(h('div', { class: 'result-extra crown' }, deco(ICONS.crown), h('span', null, 'Perfect round!')));
  if (r.levelUp) extras.push(h('div', { class: 'result-extra' }, deco(ICONS.trophy), h('span', null, `Level ${r.levelUp}!`)));
  for (const s of r.stickers || []) {
    extras.push(h('div', { class: `result-extra sticker-drop ${s.shiny ? 'shiny' : ''}` },
      deco(s.emoji), h('span', null, s.shiny ? `Surprise! Shiny sticker: ${s.name}` : `New sticker: ${s.name}`)));
  }

  screen.replaceChildren(
    h('div', { class: 'confetti' }, Array.from({ length: 24 }, (_, i) => h('i', { style: { '--i': i } }))),
    h('div', { class: 'result-card' },
      deco(ICONS.mascot, 'result-mascot'),
      h('h1', null, r.title || 'Round complete!'),
      starRow,
      ...lines,
      ...extras,
      r.note ? h('p', { class: 'result-note' }, r.note) : null,
      h('div', { class: 'result-actions' },
        r.onAgain ? h('button', { class: 'btn secondary', onClick: r.onAgain }, 'Play again') : null,
        h('button', { class: 'btn primary', onClick: r.onDone }, r.doneLabel || 'Done'))),
  );

  sfx('win');
  (async () => {
    await sleep(500);
    if (r.stickers?.length) sfx('sticker');
    if (r.stars === 3) say(GREETINGS[2].th);
  })();
}
