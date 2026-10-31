/**
 * ✅ ใช่ or ไม่ใช่?  A picture and a word: does it match?
 * Half the time it does. Answering teaches ใช่ (yes) and ไม่ใช่ (no) by using them.
 */

import { h, pickOne, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture, label } from '../core/pictures.js';
import { distractors, testHook } from './shell.js';

export default {
  id: 'yesno',
  name: 'ใช่ or ไม่ใช่?',
  icon: ICONS.yesno,
  blurb: 'Does the word match the picture?',
  rounds: 10,

  play({ frame, words, pool, done }) {
    let i = 0;
    let alive = true;
    let locked = false;
    let round = null;

    const pic = h('div', { class: 'yn-pic' });
    const shown = h('div', { class: 'yn-word' });
    const yes = h('button', { class: 'yn-btn yes' }, h('b', null, 'ใช่'), h('span', null, 'yes'));
    const no = h('button', { class: 'yn-btn no' }, h('b', null, 'ไม่ใช่'), h('span', null, 'no'));
    frame.body.append(pic, shown, h('div', { class: 'yn-buttons' }, yes, no));

    async function answer(saidYes, btn) {
      if (locked || !round) return;
      locked = true;
      const right = saidYes === round.match;
      frame.say(saidYes ? 'ใช่' : 'ไม่ใช่');
      if (right) {
        btn.classList.add('correct');
        frame.right(round.word, btn);
      } else {
        btn.classList.add('wrong');
        frame.wrong(round.word, btn);
      }
      if (!round.match || !right) {
        // Show and say what the picture really is.
        await sleep(700);
        shown.replaceChildren(h('div', { class: 'yn-truth' }, 'It is'), label(round.word));
        await frame.say(round.word.th);
      }
      await sleep(right ? 900 : 1300);
      yes.className = 'yn-btn yes';
      no.className = 'yn-btn no';
      i++;
      next();
    }
    yes.addEventListener('click', () => answer(true, yes));
    no.addEventListener('click', () => answer(false, no));

    function next() {
      if (!alive) return;
      if (i >= words.length) { done(); return; }
      frame.setProgress(i);
      const word = words[i];
      const match = Math.random() < 0.5;
      const offered = match ? word : (pickOne(distractors(word, pool, 3)) || word);
      round = { word, offered, match: offered.id === word.id };
      testHook.answer = round.match ? 'yes' : 'no';
      pic.replaceChildren(picture(word));
      shown.replaceChildren(label(offered, { english: false }));
      locked = false;
      setTimeout(() => alive && frame.say(offered.th), 250);
    }

    next();
    return () => { alive = false; };
  },
};
