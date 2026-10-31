/**
 * A tiny "ta-da" for buying a pack — four rising notes from the Web Audio
 * API, so there's no sound file to ship. Quiet on purpose, and silent rather
 * than broken anywhere audio isn't allowed.
 */

let context = null;

export function playTada() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context = context || new AudioContext();
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = start + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.7 : 0.25));
      osc.connect(gain).connect(context.destination);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  } catch {
    // No sound is fine.
  }
}
