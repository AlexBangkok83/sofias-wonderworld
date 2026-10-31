/** 👂 Listen & Find: hear a word, tap its picture. Three choices, then four. */

import { h, deco, shuffle, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture, label } from '../core/pictures.js';
import { distractors, testHook, tag } from './shell.js';

export default {
  id: 'listen',
  name: 'Listen & Find',
  icon: ICONS.listen,
  blurb: 'Hear a word, tap its picture',
  rounds: 8,

  play({ frame, words, pool, done }) {
    let i = 0;
    let target = null;
    let locked = false;
    let alive = true;

    const grid = h('div', { class: 'choice-grid' });
    frame.body.append(
      h('div', { class: 'prompt-row' },
        h('button', { class: 'speaker-btn', 'aria-label': 'Hear it again', onClick: () => frame.say(target.th) }, deco(ICONS.speaker)),
        h('button', { class: 'slow-btn', 'aria-label': 'Hear it slowly', onClick: () => frame.say(target.th, { slow: true }) }, deco(ICONS.turtle))),
      h('p', { class: 'hint' }, 'Tap the picture you hear'),
      grid,
    );

    function next() {
      if (!alive) return;
      if (i >= words.length) { done(); return; }
      frame.setProgress(i);
      target = words[i];
      locked = false;
      testHook.answer = target.id;
      const n = i < words.length / 2 ? 3 : 4;
      const options = shuffle([target, ...distractors(target, pool, n - 1)]);
      grid.className = `choice-grid n${options.length}`;
      grid.replaceChildren(...options.map((word) => {
        const btn = tag(h('button', { class: 'choice' }, picture(word)), word.id);
        btn.addEventListener('click', async () => {
          if (locked || btn.disabled) return;
          if (word.id === target.id) {
            locked = true;
            btn.classList.add('correct');
            frame.right(target, btn);
            // Now the answer is known, every picture shows its spelling.
            [...grid.children].forEach((b, k) => b.append(label(options[k])));
            await frame.say(target.th);
            if (frame.tally.streak && frame.tally.streak % 3 === 0) await frame.praise();
            await sleep(500);
            i++;
            next();
          } else {
            btn.disabled = true;
            btn.classList.add('wrong');
            frame.wrong(target, btn);
            await sleep(350);
            frame.say(target.th);
          }
        });
        return btn;
      }));
      setTimeout(() => alive && frame.say(target.th), 250);
    }

    next();
    return () => { alive = false; };
  },
};
