import { el } from './dom.js';

/**
 * The 🔒 button's safe: "What's the password?" Type it and press Open (or
 * Enter). The right word opens owner commands; anything else makes the safe
 * wobble and asks again. The check itself is in src/core/owner.js.
 */
export class LockPanel {
  constructor({ onTry, onClose }) {
    this.onTry = onTry;
    this.onClose = onClose;
    this._build();
  }

  _build() {
    this.input = el('input', {
      id: 'lock-password', type: 'text', maxlength: '24',
      autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: 'Password', 'aria-label': 'Password',
    });
    this.note = el('p', { class: 'lock-note' });
    this.dial = el('div', { class: 'safe-dial', 'aria-hidden': 'true' }, '🔒');
    this.form = el('form', {
      class: 'lock-form',
      onsubmit: (e) => {
        e.preventDefault();
        this.onTry(this.input.value);
      },
    }, this.input, el('button', { id: 'lock-open', type: 'submit', class: 'btn' }, 'Open'));

    this.card = el('div', { class: 'panel safe' },
      this.dial,
      el('h2', {}, 'What’s the password?'),
      this.form,
      this.note,
      el('button', { type: 'button', class: 'btn secondary small', onclick: () => this.onClose() }, 'Close'));
    this.root = el('div', { id: 'lock', class: 'overlay', hidden: true }, this.card);
  }

  get isOpen() {
    return !this.root.hidden;
  }

  open() {
    this.input.value = '';
    this.note.textContent = '';
    this.dial.textContent = '🔒';
    this.root.hidden = false;
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    this.root.hidden = true;
    this.input.blur();
  }

  /** The wrong word: wobble, clear it, and ask again. */
  wrong() {
    this.note.textContent = 'That’s not it. Try again!';
    this.input.value = '';
    this.card.classList.remove('shake');
    void this.card.offsetWidth;
    this.card.classList.add('shake');
    this.input.focus();
  }

  /** The right word: the lock pops open for a moment. */
  opened() {
    this.dial.textContent = '🔓';
    this.note.textContent = '';
  }
}
