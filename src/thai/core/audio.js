/**
 * The Thai voice and the little sound effects.
 *
 * Words play from the OpenAI clips in audio/ (see scripts/generate-thai-audio.mjs).
 * Any line without a clip falls back to the device's own Thai voice, so the
 * app works before the clips exist.
 *
 * One <audio> element is reused for every clip. iOS only lets an element play
 * on its own after it has once played from a tap, so `unlock()` runs on the
 * first touch and from then on games can speak when a round starts.
 */

import { settings } from './state.js';
import { pickOne } from './dom.js';
import { PRAISE, TRY_AGAIN } from '../data/chapters.js';

let clips = {};
let player = null;
let ctx = null;
let unlocked = false;

export async function loadAudio() {
  player = new Audio();
  player.preload = 'auto';
  try {
    const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
    if (res.ok) clips = (await res.json()).clips || {};
  } catch { /* no clips yet: device voice only */ }
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
}

export function unlock() {
  if (unlocked) return;
  unlocked = true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
  // A silent play from inside the tap, so later plays are allowed on iOS.
  if (player) {
    player.muted = true;
    player.play().catch(() => {}).finally(() => { player.muted = false; });
  }
}

export const hasClip = (th) => Boolean(clips[th]);
export const clipCount = () => Object.keys(clips).length;

export function thaiDeviceVoice() {
  if (!('speechSynthesis' in window)) return null;
  return speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('th')) || null;
}

export function stop() {
  if (player) { player.pause(); }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Speaks a Thai line. Resolves when it finishes (or straight away if muted). */
export function say(th, { slow = false } = {}) {
  if (!settings().sound) return Promise.resolve();
  stop();
  const clip = clips[th];
  if (clip && player) {
    return new Promise((resolve) => {
      // Never let a game wait forever on audio that stalls or is blocked.
      const safety = setTimeout(resolve, 6000);
      const finish = () => { clearTimeout(safety); resolve(); };
      player.src = `audio/${clip.file}`;
      player.playbackRate = slow ? 0.7 : 1;
      player.preservesPitch = true;
      player.onended = finish;
      player.onerror = finish;
      player.onpause = finish;
      player.play().catch(finish);
    });
  }
  return speakWithDevice(th, slow);
}

function speakWithDevice(th, slow) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(th);
    u.lang = 'th-TH';
    const voice = thaiDeviceVoice();
    if (voice) u.voice = voice;
    u.rate = slow ? 0.55 : 0.85;
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
    setTimeout(resolve, 4000); // some browsers never fire onend
  });
}

export const praise = () => say(pickOne(PRAISE).th);
export const tryAgain = () => say(pickOne(TRY_AGAIN).th);

// ───────────────────────── sound effects ─────────────────────────

function tone(freq, start, dur, { type = 'sine', gain = 0.15, slideTo = null } = {}) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SFX = {
  correct: () => { tone(660, 0, 0.12); tone(990, 0.09, 0.18); },
  wrong: () => { tone(220, 0, 0.18, { type: 'triangle', slideTo: 160, gain: 0.12 }); },
  flip: () => { tone(500, 0, 0.06, { type: 'triangle', gain: 0.06 }); },
  pop: () => { tone(900, 0, 0.08, { slideTo: 300, gain: 0.12 }); },
  coin: () => { tone(988, 0, 0.08, { type: 'square', gain: 0.05 }); tone(1319, 0.07, 0.2, { type: 'square', gain: 0.05 }); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, { gain: 0.12 })); },
  sticker: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.3, { type: 'triangle', gain: 0.1 })); },
};

export function sfx(name) {
  if (!settings().sound || !ctx) return;
  try { SFX[name]?.(); } catch { /* audio context gone */ }
}
