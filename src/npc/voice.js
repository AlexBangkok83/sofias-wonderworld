/**
 * Villager voices.
 *
 * Dialogue is fixed, so there is no reason to pay an API per playthrough or to
 * make Sofia wait on a network round-trip mid-conversation. The real voices are
 * pre-rendered to mp3 files at build time (see scripts/generate-voices.mjs) and
 * shipped as static assets.
 *
 * `public/vo/manifest.json` lists which lines have a recording. If it isn't
 * there — which is the case until Alex runs the generator with his ElevenLabs
 * key — every line falls back to the browser's own SpeechSynthesis, tuned per
 * villager so they still sound like different people.
 */

const VO_BASE = `${import.meta.env?.BASE_URL || '/'}vo/`;

export class Voice {
  constructor() {
    this.enabled = true;
    this.manifest = null;
    this.manifestLoaded = false;
    this.audioCache = new Map();
    this.current = null;
    this.currentUtterance = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this._loadVoices();
  }

  _loadVoices() {
    if (!this.synth) return;
    const read = () => {
      this.voices = this.synth.getVoices() || [];
    };
    read();
    this.synth.addEventListener?.('voiceschanged', read);
  }

  /** Load the list of pre-rendered lines. Silently fine if there isn't one. */
  async init() {
    if (this.manifestLoaded) return;
    this.manifestLoaded = true;
    try {
      const res = await fetch(`${VO_BASE}manifest.json`, { cache: 'force-cache' });
      if (res.ok) this.manifest = await res.json();
    } catch {
      this.manifest = null;
    }
  }

  static lineKey(npcId, index) {
    return `${npcId}-${index}`;
  }

  hasRecording(npcId, index) {
    return !!(this.manifest?.lines?.[Voice.lineKey(npcId, index)]);
  }

  /** Warm the cache for a villager's lines as soon as you walk up to them. */
  preload(npcId, lineCount) {
    if (!this.manifest) return;
    for (let i = 0; i < lineCount; i++) {
      if (!this.hasRecording(npcId, i)) continue;
      const key = Voice.lineKey(npcId, i);
      if (this.audioCache.has(key)) continue;
      const audio = new Audio(`${VO_BASE}${this.manifest.lines[key]}`);
      audio.preload = 'auto';
      this.audioCache.set(key, audio);
    }
  }

  stop() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
      this.current = null;
    }
    if (this.synth?.speaking) this.synth.cancel();
    this.currentUtterance = null;
  }

  /**
   * Say a line. Uses the pre-rendered recording when one exists, otherwise
   * SpeechSynthesis. Returns a promise that settles when the line finishes.
   */
  async speak(npcId, index, text, villager = {}) {
    if (!this.enabled) return;
    this.stop();

    const key = Voice.lineKey(npcId, index);
    if (this.hasRecording(npcId, index)) {
      let audio = this.audioCache.get(key);
      if (!audio) {
        audio = new Audio(`${VO_BASE}${this.manifest.lines[key]}`);
        this.audioCache.set(key, audio);
      }
      this.current = audio;
      try {
        audio.currentTime = 0;
        await audio.play();
        return await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = resolve;
        });
      } catch {
        // Autoplay blocked or the file is missing — fall through to TTS.
        this.current = null;
      }
    }

    if (!this.synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const tuning = villager.voice || {};
    utterance.pitch = Math.max(0.1, Math.min(2, tuning.pitch ?? 1));
    utterance.rate = Math.max(0.5, Math.min(2, tuning.rate ?? 1));
    utterance.volume = 1;
    // Prefer a local English voice; the exact one varies by device.
    const preferred = this.voices.find((v) => v.localService && /^en/i.test(v.lang))
      || this.voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utterance.voice = preferred;
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    await new Promise((resolve) => {
      utterance.onend = resolve;
      utterance.onerror = resolve;
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }
}
