/**
 * Little sounds, made on the fly with the Web Audio API so there are no sound
 * files to ship: a pop when you pick something up, a soft thump when it lands,
 * a click for switches, a chomp for food, notes for the piano, a ta-da in the
 * shop. All quiet on purpose, and silent rather than broken anywhere audio
 * isn't allowed.
 */

let context = null;
let enabled = true;

export function setSoundsEnabled(on) {
  enabled = on;
}

function ctx() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context = context || new AudioContext();
  if (context.state === 'suspended') context.resume();
  return context;
}

/** One note: frequency (Hz), start offset (s), length (s), wave, volume, slide-to. */
function tone(c, freq, at, length, type = 'triangle', volume = 0.08, slideTo = null) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t = c.currentTime + 0.01 + at;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

const SOUNDS = {
  pop: (c) => tone(c, 520, 0, 0.09, 'sine', 0.07, 880),
  drop: (c) => tone(c, 190, 0, 0.12, 'sine', 0.09, 90),
  boing: (c) => tone(c, 260, 0, 0.28, 'sine', 0.08, 620),
  click: (c) => tone(c, 1300, 0, 0.04, 'square', 0.025),
  tick: (c) => tone(c, 700, 0, 0.06, 'triangle', 0.04),
  chomp: (c) => { tone(c, 160, 0, 0.07, 'square', 0.04); tone(c, 140, 0.09, 0.07, 'square', 0.04); },
  note: (c) => tone(c, PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)], 0, 0.6, 'triangle', 0.09),
  squeak: (c) => tone(c, 900, 0, 0.16, 'sine', 0.06, 1500),
  sparkle: (c) => [1318, 1568, 2093].forEach((f, i) => tone(c, f, i * 0.06, 0.25, 'sine', 0.04)),
  animal: (c) => tone(c, 330, 0, 0.22, 'sawtooth', 0.025, 260),
  whoosh: (c) => tone(c, 300, 0, 0.3, 'sine', 0.05, 900),
  tada: (c) => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, i * 0.09, i === 3 ? 0.7 : 0.25, 'triangle', 0.09)),
};

export function sfx(name) {
  if (!enabled) return;
  try {
    const c = ctx();
    if (c && SOUNDS[name]) SOUNDS[name](c);
  } catch {
    // No sound is fine.
  }
}
