/**
 * 🎤 Say It: hear the word, record yourself saying it, then hear yourself
 * and Khru Mali one after the other. Never scored: comparing by ear is the
 * point. A few points for every word she records.
 */

import { h, deco, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { card } from '../core/pictures.js';
import { markSeen } from '../core/srs.js';
import { micStream, releaseMic, startRecording, playBlob } from '../core/recorder.js';
import { testHook } from './shell.js';

export const RECORD_POINTS = 3;
const MAX_SECONDS = 4;

export default {
  id: 'sayit',
  name: 'Say It',
  icon: ICONS.sayit,
  blurb: 'Record yourself and compare',
  rounds: 6,

  play({ frame, words, done }) {
    let i = 0;
    let alive = true;
    let recording = null;
    let autoStop = 0;
    const rewarded = new Set();

    const stage = h('div', { class: 'sayit-stage' });
    const recordBtn = h('button', { class: 'record-btn' }, deco(ICONS.sayit, 'rec-icon'), h('span', null, 'Tap and say it'));
    const again = h('button', { class: 'btn secondary', hidden: true }, 'Try again');
    const next = h('button', { class: 'btn primary', hidden: true }, 'Next');
    const note = h('p', { class: 'hint sayit-note' });
    frame.body.append(stage, recordBtn, note, h('div', { class: 'sayit-actions' }, again, next));

    function show() {
      if (!alive) return;
      if (i >= words.length) { finish(); return; }
      frame.setProgress(i);
      const word = words[i];
      testHook.answer = word.id;
      markSeen(word.id);
      const big = card(word, { class: 'sayit-card' });
      big.addEventListener('click', () => frame.say(word.th));
      stage.replaceChildren(big,
        h('div', { class: 'learn-audio' },
          h('button', { class: 'speaker-btn', 'aria-label': 'Hear it', onClick: () => frame.say(word.th) }, deco(ICONS.speaker)),
          h('button', { class: 'slow-btn', 'aria-label': 'Hear it slowly', onClick: () => frame.say(word.th, { slow: true }) }, deco(ICONS.turtle))));
      recordBtn.hidden = false;
      recordBtn.disabled = false;
      again.hidden = true;
      next.hidden = true;
      note.textContent = 'Listen, then tap the microphone and say it.';
      setTimeout(() => alive && frame.say(word.th), 250);
    }

    async function toggle() {
      if (recording) { stopAndCompare(); return; }
      let source;
      try {
        source = await micStream();
      } catch {
        note.textContent = "The microphone is off. Say it out loud anyway, then tap Next!";
        recordBtn.hidden = true;
        next.hidden = false;
        return;
      }
      frame.stop();
      recording = startRecording(source);
      recordBtn.classList.add('on');
      recordBtn.querySelector('span').textContent = 'Recording… tap to stop';
      autoStop = setTimeout(stopAndCompare, MAX_SECONDS * 1000);
    }

    async function stopAndCompare() {
      clearTimeout(autoStop);
      if (!recording) return;
      const rec = recording;
      recording = null;
      recordBtn.classList.remove('on');
      recordBtn.querySelector('span').textContent = 'Tap and say it';
      recordBtn.disabled = true;
      const { blob, seconds } = await rec.stop();
      const word = words[i];
      if (seconds >= 0.6 && !rewarded.has(word.id)) {
        rewarded.add(word.id);
        frame.tally.right++;
        frame.bonus(RECORD_POINTS, recordBtn);
      }
      note.textContent = 'You…';
      await playBlob(blob);
      if (!alive) return;
      await sleep(250);
      note.textContent = '…and Khru Mali';
      await frame.say(word.th);
      if (!alive) return;
      note.textContent = 'Did it sound the same? Try again or go on.';
      recordBtn.hidden = true;
      again.hidden = false;
      next.hidden = false;
    }

    function finish() {
      releaseMic();
      done({ stars: rewarded.size >= words.length ? 3 : rewarded.size >= words.length / 2 ? 2 : 1, total: words.length, perfect: false });
    }

    recordBtn.addEventListener('click', toggle);
    again.addEventListener('click', () => {
      again.hidden = true;
      next.hidden = true;
      recordBtn.hidden = false;
      recordBtn.disabled = false;
      note.textContent = 'Tap the microphone and say it.';
    });
    next.addEventListener('click', () => { i++; show(); });

    show();
    return () => {
      alive = false;
      clearTimeout(autoStop);
      if (recording) recording.stop();
      releaseMic();
    };
  },
};
