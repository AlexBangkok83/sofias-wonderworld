/**
 * 🎵 Tone Twins: two pictures whose Thai words sound almost the same
 * (หมา dog / ม้า horse, เสือ tiger / เสื้อ shirt…). Hear one, tap it. After
 * each answer both words are said one after the other, so she hears the
 * difference.
 */

import { h, deco, shuffle, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture, label } from '../core/pictures.js';
import { testHook, tag } from './shell.js';

export default {
  id: 'tones',
  name: 'Tone Twins',
  icon: ICONS.tones,
  blurb: 'Two words that sound alike: which one?',
  rounds: 10,

  /** words: targets, each with .partner (the twin) and .tip */
  play({ frame, words, done }) {
    let i = 0;
    let alive = true;
    let target = null;
    const pair = h('div', { class: 'twin-pair' });
    const tip = h('div', { class: 'twin-tip' });
    const next = h('button', { class: 'btn primary twin-next', hidden: true }, 'Next');
    frame.body.append(
      h('div', { class: 'prompt-row' },
        h('button', { class: 'speaker-btn', 'aria-label': 'Hear it again', onClick: () => frame.say(target.th) }, deco(ICONS.speaker)),
        h('button', { class: 'slow-btn', 'aria-label': 'Hear it slowly', onClick: () => frame.say(target.th, { slow: true }) }, deco(ICONS.turtle))),
      h('p', { class: 'hint' }, 'Which one did you hear?'),
      pair, tip, next);

    next.addEventListener('click', () => { i++; round(); });

    function round() {
      if (!alive) return;
      if (i >= words.length) { done(); return; }
      frame.setProgress(i);
      target = words[i];
      testHook.answer = target.id;
      next.hidden = true;
      tip.textContent = '';
      let locked = false;
      const both = shuffle([target, target.partner]);
      pair.replaceChildren(...both.map((word) => {
        const btn = tag(h('button', { class: 'choice twin' }, picture(word)), word.id);
        btn.addEventListener('click', async () => {
          if (locked) return;
          locked = true;
          const right = word.id === target.id;
          btn.classList.add(right ? 'correct' : 'wrong');
          if (right) frame.right(target, btn); else frame.wrong(target, btn);
          [...pair.children].forEach((b, k) => b.append(label(both[k])));
          tip.textContent = target.tip;
          // Say the one she heard, then its twin, so the difference sticks.
          await frame.say(target.th);
          await sleep(350);
          await frame.say(target.partner.th);
          if (alive) next.hidden = false;
        });
        return btn;
      }));
      setTimeout(() => alive && frame.say(target.th), 300);
    }

    round();
    return () => { alive = false; };
  },
};
