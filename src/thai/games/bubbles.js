/**
 * 🫧 Bubble Pop: pictures float up in bubbles. Pop the one you hear.
 * No timer: a bubble that floats away just comes round again.
 */

import { h, deco, pickOne, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { picture } from '../core/pictures.js';
import { sfx } from '../core/audio.js';
import { testHook, tag } from './shell.js';

const MAX_BUBBLES = 4;

export default {
  id: 'bubbles',
  name: 'Bubble Pop',
  icon: ICONS.bubbles,
  blurb: 'Pop the bubble you hear',
  rounds: 8,

  play({ frame, words, pool, done }) {
    let i = 0;
    let target = words[0];
    let alive = true;
    let raf = 0;
    let last = performance.now();
    const bubbles = [];

    const field = h('div', { class: 'bubble-field' });
    const caption = h('div', { class: 'bubble-caption' });
    frame.body.append(
      h('div', { class: 'prompt-row' },
        h('button', { class: 'speaker-btn', 'aria-label': 'Hear it again', onClick: () => frame.say(target.th) }, deco(ICONS.speaker)),
        h('button', { class: 'slow-btn', 'aria-label': 'Hear it slowly', onClick: () => frame.say(target.th, { slow: true }) }, deco(ICONS.turtle))),
      field, caption);

    const size = () => Math.min(140, Math.max(96, field.clientWidth * 0.3));

    /** Others in the air: anything from the pool that can't be confused with the target. */
    function randomOther() {
      const others = pool.filter((w) => w.th !== target.th && w.en !== target.en);
      return pickOne(others.length ? others : pool);
    }

    function spawn(word) {
      const d = size();
      const lanes = Math.max(2, Math.floor(field.clientWidth / (d * 1.05)));
      const laneW = field.clientWidth / lanes;
      const busy = new Set(bubbles.filter((b) => b.y > field.clientHeight - d * 1.6).map((b) => b.lane));
      const free = [...Array(lanes).keys()].filter((l) => !busy.has(l));
      if (!free.length) return false;
      const lane = pickOne(free);
      const b = {
        word, lane, d,
        x: lane * laneW + (laneW - d) / 2,
        y: field.clientHeight + Math.random() * d * 0.5,
        speed: field.clientHeight / (6.5 + Math.random() * 2.5),
        phase: Math.random() * Math.PI * 2,
        el: tag(h('button', { class: 'bubble', style: { width: `${d}px`, height: `${d}px` } }, picture(word)), word.id),
      };
      b.el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
      field.append(b.el);
      bubbles.push(b);
      return true;
    }

    function remove(b) {
      bubbles.splice(bubbles.indexOf(b), 1);
      b.el.remove();
    }

    async function tap(b) {
      if (b.popped) return;
      if (b.word.id === target.id) {
        b.popped = true;
        b.el.classList.add('pop');
        sfx('pop');
        frame.right(target, b.el);
        caption.replaceChildren(h('b', null, target.th), h('span', null, target.rom));
        frame.say(target.th);
        setTimeout(() => remove(b), 300);
        i++;
        frame.setProgress(i);
        if (i >= words.length) {
          await sleep(900);
          if (alive) done();
          return;
        }
        await sleep(900);
        if (!alive) return;
        target = words[i];
        testHook.answer = target.id;
        caption.replaceChildren();
        frame.say(target.th);
      } else if (!b.wobbling) {
        b.wobbling = true;
        b.el.classList.add('wobble');
        frame.wrong(target, b.el);
        setTimeout(() => { b.wobbling = false; b.el.classList.remove('wobble'); }, 600);
        setTimeout(() => alive && frame.say(target.th), 400);
      }
    }

    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const b of [...bubbles]) {
        if (b.popped) continue;
        b.y -= b.speed * dt;
        b.phase += dt * 1.6;
        const sway = Math.sin(b.phase) * 8;
        b.el.style.transform = `translate(${b.x + sway}px, ${b.y}px)`;
        if (b.y < -b.d) remove(b);
      }
      const live = bubbles.filter((b) => !b.popped);
      if (!live.some((b) => b.word.id === target.id)) spawn(target);
      else if (live.length < MAX_BUBBLES) spawn(randomOther());
      raf = requestAnimationFrame(tick);
    }

    testHook.answer = target.id;
    setTimeout(() => {
      if (!alive) return;
      frame.say(target.th);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }, 300);

    return () => { alive = false; cancelAnimationFrame(raf); };
  },
};
