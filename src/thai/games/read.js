/** 🔤 Read It: see a picture, tap the right Thai word out of three. */

import { h, shuffle, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture } from '../core/pictures.js';
import { settings } from '../core/state.js';
import { distractors, testHook, tag } from './shell.js';

export default {
  id: 'read',
  name: 'Read It',
  icon: ICONS.read,
  blurb: 'See a picture, pick the Thai word',
  rounds: 8,

  play({ frame, words, pool, done }) {
    let i = 0;
    let alive = true;
    const stage = h('div', { class: 'read-stage' });
    const answers = h('div', { class: 'answer-list' });
    frame.body.append(stage, h('p', { class: 'hint' }, 'Which word is it?'), answers);

    function next() {
      if (!alive) return;
      if (i >= words.length) { done(); return; }
      frame.setProgress(i);
      const target = words[i];
      testHook.answer = target.id;
      let locked = false;
      const meaning = h('div', { class: 'read-meaning' });
      stage.replaceChildren(h('div', { class: 'read-pic' }, picture(target)), meaning);
      const options = shuffle([target, ...distractors(target, pool, 2)]);
      answers.replaceChildren(...options.map((word) => {
        const btn = tag(h('button', { class: 'answer' },
          h('span', { class: 'th' }, word.th),
          settings().roman ? h('span', { class: 'rom' }, word.rom) : null), word.id);
        btn.addEventListener('click', async () => {
          if (locked || btn.disabled) return;
          frame.say(word.th);
          if (word.id === target.id) {
            locked = true;
            btn.classList.add('correct');
            frame.right(target, btn);
            if (settings().english) meaning.textContent = target.en;
            await sleep(1500);
            i++;
            next();
          } else {
            btn.disabled = true;
            btn.classList.add('wrong');
            frame.wrong(target, btn);
          }
        });
        return btn;
      }));
    }

    next();
    return () => { alive = false; };
  },
};
