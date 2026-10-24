import { el } from '../ui/ui.js';
import { IS_TOUCH } from '../core/input.js';
import {
  checkMessage, contactList, createCall, answer, respond, personaEmoji,
  PLAYER_VOICES, getPlayerVoice,
} from './brain.js';

// How long the phone rings before the villager picks up.
const RING_MS = 1800;
// How long a villager "types" before answering, so replies don't feel instant.
const THINK_MS = 700;
// How long "Call ended" stays up before the contacts come back.
const ENDED_MS = 1400;

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * The in-game phone.
 *
 * Sofia's design, in her words: you call someone, "you need to write what you
 * say, and then you pick the voice, and then it sends over". So a call is
 * those three steps on repeat — write it, pick a voice (and try it out), send
 * it — and the villager answers out loud in their own voice.
 *
 * The only contacts are villagers (see brain.js for why, and for the safety
 * shield every message goes through). Typed text is only ever put on screen
 * as text nodes, never as HTML.
 */
export class Phone {
  constructor(root, voice) {
    this.voice = voice;
    /** Supplied by main.js: who's playing and what they've found. */
    this.getContext = () => ({ playerName: '', moonFound: false });
    this.onVoiceChange = null;
    this.onRequestClose = null;

    this.voiceId = PLAYER_VOICES[0].id;
    this.call = null;
    this.screen = 'contacts';
    this.busy = false;
    // Bumped whenever a call starts or stops, so a reply that was still on its
    // way when she hung up doesn't land in the next call.
    this.token = 0;
    this.audio = null;
    this._timer = null;
    this._fit = () => this._fitToViewport();

    this._build();
    root.append(this.overlay);
  }

  get isOpen() {
    return !this.overlay.hidden;
  }

  setVoice(id) {
    this.voiceId = getPlayerVoice(id).id;
    this._renderVoices();
  }

  // ------------------------------------------------------------------
  // Building the screens
  // ------------------------------------------------------------------
  _build() {
    // --- contacts ---
    this.contactsEl = el('div', { class: 'contact-list' });
    this.contactsScreen = el('div', { class: 'phone-screen contacts' },
      el('h2', {}, 'Phone'),
      el('p', { class: 'sub' }, 'Who do you want to call?'),
      this.contactsEl,
      el('p', { class: 'safe-note' }, '🛡️ Only villagers live in this phone. No strangers, ever.'));

    // --- ringing ---
    this.ringAvatar = el('div', { class: 'big-avatar' });
    this.ringName = el('div', { class: 'ring-name' });
    this.ringScreen = el('div', { class: 'phone-screen ringing', hidden: true },
      this.ringAvatar,
      this.ringName,
      el('div', { class: 'ring-status' }, 'Calling…'),
      el('button', {
        class: 'hang-up', 'aria-label': 'Hang up', title: 'Hang up',
        onclick: () => this.hangUp(),
      }, '📞'));

    // --- in a call ---
    this.callAvatar = el('div', { class: 'call-avatar' });
    this.callName = el('div', { class: 'call-name' });
    this.callTimer = el('div', { class: 'call-timer' }, '0:00');
    this.chat = el('div', { class: 'chat', 'aria-live': 'polite' });
    this.shield = el('div', { class: 'shield', role: 'alert', hidden: true });
    this.input = el('input', {
      type: 'text',
      maxlength: '120',
      placeholder: 'Type what you want to say…',
      enterkeyhint: 'send',
      autocomplete: 'off',
      'aria-label': 'What you want to say',
      oninput: () => this._hideShield(),
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.send();
      }
    });
    this.voiceChips = el('div', { class: 'voice-chips' });
    this.tryBtn = el('button', {
      class: 'btn secondary try-btn', onclick: () => this.tryVoice(),
    }, '👂 Try it');
    this.sendBtn = el('button', { class: 'btn send-btn', onclick: () => this.send() }, 'Send ➤');

    this.composer = el('div', { class: 'composer' },
      this.shield,
      el('div', { class: 'step' }, el('span', { class: 'num' }, '1'), 'Write what you want to say'),
      this.input,
      el('div', { class: 'step' }, el('span', { class: 'num' }, '2'), 'Pick a voice'),
      this.voiceChips,
      el('div', { class: 'send-row' },
        this.tryBtn,
        el('div', { class: 'step inline' }, el('span', { class: 'num' }, '3')),
        this.sendBtn));

    this.callScreen = el('div', { class: 'phone-screen call', hidden: true },
      el('div', { class: 'call-header' },
        this.callAvatar,
        el('div', { class: 'call-who' }, this.callName, this.callTimer),
        el('button', {
          class: 'hang-up small', 'aria-label': 'Hang up', title: 'Hang up',
          onclick: () => this.hangUp(),
        }, '📞')),
      this.chat,
      this.composer);

    // --- the phone itself ---
    this.clock = el('span', { class: 'clock' });
    this.overlay = el('div', { id: 'phone', class: 'overlay', hidden: true },
      el('div', { class: 'phone-device' },
        el('div', { class: 'phone-status' },
          this.clock,
          el('span', { class: 'safe-badge' }, '🛡️ Safe'),
          el('span', {}, '🔋')),
        el('div', { class: 'phone-body' },
          this.contactsScreen, this.ringScreen, this.callScreen),
        el('button', {
          class: 'phone-home', onclick: () => this.onRequestClose?.(),
        }, 'Close phone')));
  }

  _show(screen) {
    this.screen = screen;
    this.contactsScreen.hidden = screen !== 'contacts';
    this.ringScreen.hidden = screen !== 'ringing';
    this.callScreen.hidden = screen !== 'call';
  }

  _renderContacts() {
    this.contactsEl.replaceChildren(...contactList(this.getContext()).map((c) => el('button', {
      class: 'contact', 'data-id': c.id, onclick: () => this.dial(c.id),
    },
    el('span', { class: 'avatar' }, c.emoji),
    el('span', { class: 'who' },
      el('span', { class: 'name' }, c.name),
      el('span', { class: 'role' }, c.role)),
    el('span', { class: 'dial', 'aria-hidden': 'true' }, '📞'))));
  }

  _renderVoices() {
    this.voiceChips.replaceChildren(...PLAYER_VOICES.map((v) => el('button', {
      class: `voice-chip${v.id === this.voiceId ? ' active' : ''}`,
      'data-voice': v.id,
      'aria-pressed': v.id === this.voiceId ? 'true' : 'false',
      onclick: () => this.pickVoice(v.id),
    }, el('span', { class: 'emoji' }, v.emoji), v.label)));
  }

  // ------------------------------------------------------------------
  // Opening and closing
  // ------------------------------------------------------------------
  open() {
    this.clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    this.showContacts();
    this.overlay.hidden = false;
    window.visualViewport?.addEventListener('resize', this._fit);
    window.visualViewport?.addEventListener('scroll', this._fit);
    this._fitToViewport();
  }

  /** Put the phone away. Any call just stops — no goodbyes. */
  hide() {
    this.token += 1;
    this.call = null;
    this.busy = false;
    this._stopTimer();
    this.voice.stop();
    this.input.blur();
    this.overlay.hidden = true;
    window.visualViewport?.removeEventListener('resize', this._fit);
    window.visualViewport?.removeEventListener('scroll', this._fit);
    this.overlay.style.top = '';
    this.overlay.style.height = '';
    this.overlay.style.bottom = '';
  }

  // On a phone the on-screen keyboard covers the bottom half. Keep the whole
  // phone inside what's left, so the box she's typing in stays in view.
  _fitToViewport() {
    const vv = window.visualViewport;
    if (!vv || !IS_TOUCH) return;
    this.overlay.style.top = `${vv.offsetTop}px`;
    this.overlay.style.height = `${vv.height}px`;
    this.overlay.style.bottom = 'auto';
  }

  showContacts() {
    this.token += 1;
    this.call = null;
    this.busy = false;
    this._stopTimer();
    this._renderContacts();
    this._show('contacts');
  }

  // ------------------------------------------------------------------
  // A call
  // ------------------------------------------------------------------
  async dial(id) {
    const token = ++this.token;
    this.call = createCall(id, this.getContext());
    this.ringAvatar.textContent = personaEmoji(id);
    this.ringName.textContent = this.call.villager.name;
    this._show('ringing');
    this._ring();
    this.voice.unlock();

    await wait(RING_MS);
    if (token !== this.token) return;

    const call = this.call;
    this.chat.replaceChildren();
    this.callAvatar.textContent = personaEmoji(id);
    this.callName.textContent = call.villager.name;
    this.input.value = '';
    this._hideShield();
    this._setBusy(false);
    this.composer.classList.remove('ended');
    this._renderVoices();
    this._show('call');
    this._startTimer();

    this._bubble('system', `${call.villager.name} picked up!`);
    if (!this.voice.enabled) this._bubble('system', '🔇 Voices are off in the menu');
    const hello = answer(call);
    this._bubble('them', hello);
    // Not on a touch screen: focusing would throw the keyboard up over the
    // greeting before she's had a chance to read it.
    if (!IS_TOUCH) this.input.focus();
    this.voice.sayText(hello, call.villager.voice);
  }

  /** Step 2: picking a voice plays it, so she can hear what she's choosing. */
  pickVoice(id) {
    this.voiceId = getPlayerVoice(id).id;
    this.onVoiceChange?.(this.voiceId);
    this._renderVoices();
    this.tryVoice();
  }

  /** Hear your message in the voice you picked, before sending it. */
  tryVoice() {
    const v = getPlayerVoice(this.voiceId);
    const check = checkMessage(this.input.value);
    if (!check.ok && check.reason !== 'empty') {
      this._showShield(check.shield);
      return;
    }
    this.voice.sayText(check.ok ? check.text : v.sample, v);
  }

  /** Step 3: send it. It's said out loud in your voice, then they answer. */
  async send() {
    if (!this.call || this.busy || this.screen !== 'call') return;
    const check = checkMessage(this.input.value);
    if (!check.ok) {
      if (check.shield) this._showShield(check.shield);
      return;
    }

    const token = this.token;
    const call = this.call;
    const mine = getPlayerVoice(this.voiceId);
    this._hideShield();
    this.input.value = '';
    this._bubble('me', check.text, `${mine.emoji} ${mine.label} voice`);
    this._setBusy(true);

    await this.voice.sayText(check.text, mine);
    if (token !== this.token) return;
    const typing = this._bubble('typing');
    await wait(THINK_MS);
    if (token !== this.token) return;
    typing.remove();

    const reply = respond(call, check.text);
    this._bubble('them', reply.text);
    if (!reply.hangUp) {
      this._setBusy(false);
      this.voice.sayText(reply.text, call.villager.voice);
      return;
    }
    await this.voice.sayText(reply.text, call.villager.voice);
    if (token !== this.token) return;
    this._endCall(`${call.villager.name} hung up. Bye!`);
  }

  hangUp() {
    if (this.screen === 'call' && this.call) {
      this.voice.stop();
      this._endCall('📞 Call ended');
    } else {
      this.voice.stop();
      this.showContacts();
    }
  }

  async _endCall(message) {
    const token = ++this.token;
    this.call = null;
    this._stopTimer();
    this._setBusy(false);
    this.composer.classList.add('ended');
    this.input.blur();
    this._bubble('system', message);
    await wait(ENDED_MS);
    if (token !== this.token) return;
    this.showContacts();
  }

  // ------------------------------------------------------------------
  // Bits
  // ------------------------------------------------------------------
  _bubble(kind, text = '', tag = null) {
    const node = kind === 'typing'
      ? el('div', { class: 'bubble typing', 'aria-label': 'typing' }, el('i'), el('i'), el('i'))
      : el('div', { class: `bubble ${kind}` }, text, tag ? el('span', { class: 'tag' }, tag) : null);
    this.chat.append(node);
    this.chat.scrollTop = this.chat.scrollHeight;
    return node;
  }

  _setBusy(busy) {
    this.busy = busy;
    this.sendBtn.disabled = busy;
  }

  _showShield(text) {
    this.shield.textContent = text;
    this.shield.hidden = false;
  }

  _hideShield() {
    this.shield.hidden = true;
  }

  _startTimer() {
    this._stopTimer();
    const started = Date.now();
    const tick = () => {
      const s = Math.floor((Date.now() - started) / 1000);
      this.callTimer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    tick();
    this._timer = setInterval(tick, 1000);
  }

  _stopTimer() {
    clearInterval(this._timer);
    this._timer = null;
  }

  /** "Ring ring", made with two sine waves — no sound files to load. */
  _ring() {
    if (!this.voice.enabled) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      this.audio = this.audio || new Ctx();
      const ctx = this.audio;
      ctx.resume?.();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.05;
      for (const [on, off] of [[0, 0.4], [0.6, 1.0]]) {
        gain.gain.setValueAtTime(0, t0 + on);
        gain.gain.linearRampToValueAtTime(0.08, t0 + on + 0.03);
        gain.gain.setValueAtTime(0.08, t0 + off - 0.03);
        gain.gain.linearRampToValueAtTime(0, t0 + off);
      }
      for (const freq of [440, 480]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(t0);
        osc.stop(t0 + 1.05);
      }
    } catch {
      // No sound is fine; the phone still rings on screen.
    }
  }
}
