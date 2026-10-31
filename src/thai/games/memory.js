/**
 * 🃏 Memory Match: pair each Thai word card (ไก่ · gài) with its picture.
 * Both cards say the word when flipped. Once a pair matches, the picture
 * card shows its spelling too.
 *
 * Memory never takes points away: turning over the wrong card is how the
 * game is played, not a wrong answer.
 */

import { h, shuffle, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture, label } from '../core/pictures.js';
import { markSeen, isFresh } from '../core/srs.js';
import { sfx } from '../core/audio.js';
import { tag } from './shell.js';

export default {
  id: 'memory',
  name: 'Memory Match',
  icon: ICONS.memory,
  blurb: 'Pair each Thai word with its picture',
  rounds: 6, // pairs

  play({ frame, words, done }) {
    const pairs = words.slice(0, 6);
    const cards = shuffle(pairs.flatMap((word) => [{ word, kind: 'word' }, { word, kind: 'pic' }]));
    let open = [];
    let busy = false;
    let flips = 0;
    let matched = 0;
    let alive = true;

    const grid = h('div', { class: `memory-grid c${cards.length}` });
    frame.body.append(h('p', { class: 'hint' }, 'Find the pairs'), grid);

    for (const c of cards) {
      const front = c.kind === 'word'
        ? h('div', { class: 'face front word-face' }, label(c.word, { english: false }))
        : h('div', { class: 'face front pic-face' }, picture(c.word));
      c.el = tag(h('button', { class: 'mcard', 'aria-label': 'Card' },
        h('div', { class: 'inner' },
          h('div', { class: 'face back' }, h('span', null, 'ก')),
          front)), `${c.word.id}|${c.kind}`);
      c.front = front;
      c.el.addEventListener('click', () => flip(c));
      grid.append(c.el);
    }

    async function flip(c) {
      if (busy || c.done || open.includes(c)) return;
      c.el.classList.add('flipped');
      sfx('flip');
      frame.say(c.word.th);
      open.push(c);
      if (open.length < 2) return;

      flips++;
      const [a, b] = open;
      busy = true;
      if (a.word.id === b.word.id) {
        a.done = b.done = true;
        await sleep(450);
        a.el.classList.add('matched');
        b.el.classList.add('matched');
        const pic = a.kind === 'pic' ? a : b;
        pic.front.append(label(pic.word, { english: false }));
        markSeen(a.word.id);
        sfx('correct');
        frame.bonus(isFresh(a.word.id) ? 5 : 2, pic.el);
        matched++;
        frame.tally.right++;
        frame.setProgress(matched);
        open = [];
        busy = false;
        if (matched === pairs.length) {
          await sleep(700);
          if (!alive) return;
          const misses = flips - pairs.length;
          frame.tally.wrong = misses;
          const stars = misses <= pairs.length ? 3 : misses <= pairs.length * 2 ? 2 : 1;
          done({ stars, total: pairs.length });
        }
      } else {
        await sleep(1100);
        a.el.classList.remove('flipped');
        b.el.classList.remove('flipped');
        open = [];
        busy = false;
      }
    }

    return () => { alive = false; };
  },
};
