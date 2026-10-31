/**
 * The grown-ups area, behind a 4-digit PIN (set on first visit): approve
 * swaps, set the swap rate and penalty, learning settings, progress, voice
 * status, reset.
 */

import { h, fmt, toast } from '../core/dom.js';
import { CHAPTERS } from '../data/chapters.js';
import {
  S, settings, setSetting, pendingSwaps, settleSwap, resetProgress, dateKey,
} from '../core/state.js';
import { chapterWords, isMastered, isSeen } from '../core/srs.js';
import { stars } from '../core/progress.js';
import { clipCount, thaiDeviceVoice } from '../core/audio.js';
import { photoCount } from '../core/pictures.js';
import { go } from '../core/router.js';
import { statusBar, bottomNav } from './common.js';

let unlockedUntil = 0; // stays open for 10 minutes, then asks again

function pinPad(screen, { title, onDone }) {
  let digits = '';
  const dots = h('div', { class: 'pin-dots' });
  const draw = () => dots.replaceChildren(...[0, 1, 2, 3].map((k) => h('i', { class: k < digits.length ? 'on' : '' })));
  draw();
  const press = (d) => {
    if (d === '⌫') digits = digits.slice(0, -1);
    else if (digits.length < 4) digits += d;
    draw();
    if (digits.length === 4) { const v = digits; digits = ''; setTimeout(() => { draw(); onDone(v); }, 150); }
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  screen.append(
    statusBar(),
    h('main', { class: 'page pin-page' },
      h('h1', null, title),
      dots,
      h('div', { class: 'pin-keys' }, keys.map((k) => (k
        ? h('button', { class: 'pin-key', onClick: () => press(k) }, k)
        : h('span'))))),
    bottomNav('/parents'),
  );
}

export function parentsRoute(screen) {
  const st = settings();
  if (!st.pin) {
    let first = null;
    const ask = (title) => {
      screen.replaceChildren();
      pinPad(screen, {
        title,
        onDone: (pin) => {
          if (!first) { first = pin; ask('Type the PIN again'); return; }
          if (pin !== first) { first = null; toast("Those didn't match. Try again."); ask('Choose a grown-up PIN'); return; }
          setSetting('pin', pin);
          unlockedUntil = Date.now() + 10 * 60e3;
          go(`/parents?ok=${Date.now()}`);
        },
      });
    };
    ask('Choose a grown-up PIN');
    return null;
  }
  if (Date.now() > unlockedUntil) {
    pinPad(screen, {
      title: 'Grown-ups only',
      onDone: (pin) => {
        if (pin !== st.pin) { toast('Wrong PIN'); return; }
        unlockedUntil = Date.now() + 10 * 60e3;
        go(`/parents?ok=${Date.now()}`);
      },
    });
    return null;
  }
  renderPanel(screen);
  return null;
}

function numberField(labelText, key, { min = 0, max = 100000, step = 1, hint } = {}) {
  const input = h('input', { type: 'number', inputmode: 'numeric', min, max, step, value: settings()[key] });
  input.addEventListener('change', () => {
    const v = Math.max(min, Math.min(max, Math.round(Number(input.value) || 0)));
    input.value = v;
    setSetting(key, v);
  });
  return h('label', { class: 'field' }, h('span', null, labelText), input, hint ? h('small', null, hint) : null);
}

function toggle(labelText, key, hint) {
  const input = h('input', { type: 'checkbox' });
  input.checked = Boolean(settings()[key]);
  input.addEventListener('change', () => setSetting(key, input.checked));
  return h('label', { class: 'toggle' }, input, h('span', null, labelText, hint ? h('small', null, hint) : null));
}

function renderPanel(screen) {
  const st = settings();
  const reward = st.rewardName || 'Robux';
  const s = S();
  const refresh = () => go(`/parents?r=${Date.now()}`);

  // Swap requests
  const waiting = pendingSwaps();
  const swaps = h('section', { class: 'panel' },
    h('h2', null, 'Swap requests'),
    waiting.length
      ? h('ul', { class: 'request-list' }, waiting.map((r) => h('li', null,
        h('div', null, h('b', null, `${fmt(r.reward)} ${reward}`), h('span', null, ` for ${fmt(r.points)} points`),
          h('small', null, new Date(r.asked).toLocaleString())),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary small', onClick: () => { settleSwap(r.id, true); toast(`Done. Remember to give her ${fmt(r.reward)} ${reward}!`); refresh(); } }, 'Approve'),
          h('button', { class: 'btn secondary small', onClick: () => { settleSwap(r.id, false); toast('Declined. Points returned.'); refresh(); } }, 'Decline')))))
      : h('p', { class: 'hint' }, 'No requests waiting.'));

  // Points & swap rate
  const rewardName = h('input', { type: 'text', value: reward, maxlength: 20 });
  rewardName.addEventListener('change', () => setSetting('rewardName', rewardName.value.trim() || 'Robux'));
  const points = h('section', { class: 'panel' },
    h('h2', null, 'Points & swap rate'),
    h('p', { class: 'hint' }, `Wallet: ${fmt(s.wallet)} points · earned all-time: ${fmt(s.lifetime)}`),
    h('div', { class: 'rate-row' },
      numberField('Points', 'ratePoints', { min: 0, max: 100000 }),
      h('span', { class: 'eq' }, '='),
      numberField('Reward', 'rateReward', { min: 0, max: 100000 }),
      h('label', { class: 'field' }, h('span', null, 'Reward name'), rewardName)),
    h('p', { class: 'hint' }, `Leave at 0 until you decide. ${st.name || 'Sofia'} sees "not set yet" and keeps saving.`),
    numberField('Points taken for a wrong answer', 'penalty', { min: 0, max: 10, hint: 'Right first time earns 10, so 2 means guessing never pays.' }),
    numberField('Most points per day (0 = no limit)', 'dailyCap', { min: 0, max: 100000 }));

  // Learning settings
  const nameInput = h('input', { type: 'text', value: st.name, maxlength: 20 });
  nameInput.addEventListener('change', () => setSetting('name', nameInput.value.trim() || 'Sofia'));
  const learning = h('section', { class: 'panel' },
    h('h2', null, 'Learning'),
    toggle('Show pronunciation (gài)', 'roman'),
    toggle('Show English meaning', 'english'),
    toggle('Sound', 'sound'),
    toggle('Unlock every chapter', 'unlockAll', 'Normally a chapter opens after 2 stars in the one before.'),
    h('label', { class: 'field' }, h('span', null, "Learner's name"), nameInput));

  // Progress
  const days = Object.entries(s.history).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
  const progress = h('section', { class: 'panel' },
    h('h2', null, 'Progress'),
    h('table', { class: 'days' },
      h('tr', null, h('th', null, 'Day'), h('th', null, 'Earned'), h('th', null, 'Lost'), h('th', null, 'Right'), h('th', null, 'Wrong')),
      days.length ? days.map(([d, v]) => h('tr', null,
        h('td', null, d === dateKey() ? 'Today' : d), h('td', null, fmt(v.earned)), h('td', null, fmt(v.lost)),
        h('td', null, fmt(v.right)), h('td', null, fmt(v.wrong))))
        : h('tr', null, h('td', { colspan: 5 }, 'Nothing yet.'))),
    h('div', { class: 'chapter-bars' }, CHAPTERS.map((c, i) => {
      const words = chapterWords(c.id);
      const seen = words.filter((w) => isSeen(w.id)).length;
      const mastered = words.filter((w) => isMastered(w.id)).length;
      return h('div', { class: 'cbar' },
        h('span', null, `${i + 1}. ${c.title}`),
        h('span', { class: 'bar' },
          h('i', { class: 'seen', style: { width: `${(seen / words.length) * 100}%` } }),
          h('i', { class: 'mastered', style: { width: `${(mastered / words.length) * 100}%` } })),
        h('small', null, `${'★'.repeat(stars(c))}${'☆'.repeat(3 - stars(c))} ${mastered}/${words.length}`));
    })),
    h('p', { class: 'hint' }, 'Light bar: words seen. Dark bar: words mastered.'));

  // Voice & pictures
  const device = thaiDeviceVoice();
  const media = h('section', { class: 'panel' },
    h('h2', null, 'Voice & pictures'),
    h('p', null, `${clipCount()} OpenAI voice clips installed.`,
      device ? ` Device Thai voice: ${device.name}.` : ' This device has no Thai voice of its own, so clips are needed.'),
    h('p', null, `${photoCount()} photos installed.`, photoCount() ? '' : ' Words show a plain card until photos are added.'),
    h('p', { class: 'hint' }, 'Photos provided by Pexels and Pixabay. Photographers are credited in thai/PHOTO-CREDITS.md.'));

  // Danger zone
  const danger = h('section', { class: 'panel danger' },
    h('h2', null, 'Reset'),
    h('button', { class: 'btn secondary small', onClick: () => { setSetting('pin', null); unlockedUntil = 0; toast('PIN cleared. Choose a new one.'); refresh(); } }, 'Change PIN'),
    h('button', {
      class: 'btn danger small',
      onClick: () => {
        // eslint-disable-next-line no-alert
        if (confirm('Erase all progress, points and stickers? Settings and PIN stay.')) { resetProgress(); toast('Progress erased.'); refresh(); }
      },
    }, 'Erase progress'));

  screen.classList.add('parents-screen');
  screen.append(
    statusBar(),
    h('main', { class: 'page' },
      h('div', { class: 'row spread' },
        h('h1', null, 'Grown-ups'),
        h('button', { class: 'btn secondary small', onClick: () => { unlockedUntil = 0; go('/'); } }, 'Lock')),
      swaps, points, learning, progress, media, danger),
    bottomNav('/parents'),
  );
}
