import { el, twoTapButton } from './dom.js';
import { PLACES } from '../world/places.js';

/**
 * Owner commands — the 👑 button, only on the owner's device. The 🔒 button
 * asks for the owner's password (src/core/owner.js); the right word turns
 * these on, starting with infinite money.
 *
 *   💰 infinite money       every pack can be bought, and buying is free
 *   🎁 get every pack       all of them, right now
 *   🗺 go anywhere          straight to any place, the Moon House included
 *   👫 bring everyone here  every person in the village comes to you
 *   🧹 tidy up              put this place back how it started
 *   🔒 lock                 for when someone else plays on this device
 */

const PLACE_EMOJI = {
  town: '🏘', cottage: '🏡', modern: '🏢', bakery: '🥐', barn: '🐄', library: '📚', moon: '🌙',
};

export class OwnerPanel {
  constructor({ onCommand, onClose }) {
    this.onCommand = onCommand;
    this.onClose = onClose;
    this._build();
  }

  _build() {
    this.moneyBtn = el('button', {
      id: 'cmd-money', class: 'btn small',
      onclick: () => this.onCommand('money', this.moneyBtn.dataset.on !== 'true'),
    }, 'On');

    const places = Object.values(PLACES).map((place) => el('button', {
      class: 'chip place-chip', 'data-place': place.id,
      onclick: () => this.onCommand('go', place.id),
    }, `${PLACE_EMOJI[place.id] || '📍'} ${place.label.replace(/^The /, '')}`));

    this.root = el('div', { id: 'owner', class: 'overlay', hidden: true },
      el('div', { class: 'panel menu-card owner-card' },
        el('div', { class: 'owner-crown' }, '👑'),
        el('h2', {}, 'Owner commands'),
        el('p', { class: 'sub' }, 'Only the owner has these. They work on this device.'),
        el('div', { class: 'menu-rows' },
          el('div', { class: 'setting' }, el('span', {}, '💰 Infinite money'), this.moneyBtn),
          el('button', { id: 'cmd-packs', class: 'btn', onclick: () => this.onCommand('packs') }, '🎁 Get every pack'),
          el('div', { class: 'owner-group' },
            el('div', { class: 'opt-label' }, '🗺 Go anywhere'),
            el('div', { class: 'chips' }, places)),
          el('button', { id: 'cmd-gather', class: 'btn lilac', onclick: () => this.onCommand('gather') }, '👫 Bring everyone here'),
          twoTapButton({
            id: 'cmd-tidy', cls: 'btn secondary', label: '🧹 Tidy up this place',
            armedLabel: 'Tap again to put this place back how it started',
            onConfirm: () => this.onCommand('tidy'),
          }),
          el('button', {
            id: 'cmd-lock', class: 'btn danger small', onclick: () => this.onCommand('lock'),
          }, '🔒 Lock owner commands'),
          el('button', { class: 'btn secondary', onclick: () => this.onClose() }, 'Done'))));
  }

  get isOpen() {
    return !this.root.hidden;
  }

  open({ infinite, place }) {
    this.setInfinite(infinite);
    for (const chip of this.root.querySelectorAll('.place-chip')) {
      chip.classList.toggle('active', chip.dataset.place === place);
    }
    this.root.hidden = false;
  }

  close() {
    this.root.hidden = true;
  }

  setInfinite(on) {
    this.moneyBtn.dataset.on = String(on);
    this.moneyBtn.textContent = on ? 'On' : 'Off';
  }
}
