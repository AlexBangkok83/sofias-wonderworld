/**
 * Swap points for Robux. Sofia asks; a grown-up approves in the Grown-ups
 * area. The points are set aside while she waits, and come back if declined.
 */

import { h, deco, fmt, toast } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { S, settings, rateSet, rewardFor, requestSwap, pendingSwaps } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { go } from '../core/router.js';
import { statusBar, bottomNav } from './common.js';

export function swapRoute(screen) {
  const st = settings();
  const reward = st.rewardName || 'Robux';
  const wallet = S().wallet;

  const body = [
    h('div', { class: 'wallet-card' },
      deco(ICONS.star, 'wallet-star'),
      h('div', null, h('b', null, fmt(wallet)), h('span', null, 'points to spend'))),
  ];

  if (!rateSet()) {
    body.push(h('div', { class: 'notice' },
      deco(ICONS.gem, 'notice-icon'),
      h('p', null, `A grown-up hasn't set how many points make ${reward} yet. Keep collecting. Your points are saved!`)));
  } else {
    body.push(h('p', { class: 'rate' }, `${fmt(st.ratePoints)} points = ${fmt(st.rateReward)} ${reward}`));
    const steps = [1, 5, 10].map((m) => m * st.ratePoints).filter((p, i, a) => a.indexOf(p) === i);
    const max = Math.floor(wallet / st.ratePoints) * st.ratePoints;
    if (max > steps[steps.length - 1]) steps.push(max);
    body.push(h('div', { class: 'swap-options' }, steps.map((points) => {
      const can = points <= wallet;
      return h('button', {
        class: `swap-btn ${can ? '' : 'disabled'}`,
        disabled: can ? null : true,
        onClick: () => {
          if (!requestSwap(points)) return;
          sfx('coin');
          toast('Asked! A grown-up will check it.');
          go(`/swap?asked=${Date.now()}`);
        },
      },
      h('b', null, `${fmt(rewardFor(points))} ${reward}`),
      h('span', null, `for ${fmt(points)} points`),
      can ? null : h('small', null, `${fmt(points - wallet)} more to go`));
    })));
  }

  const waiting = pendingSwaps();
  if (waiting.length) {
    body.push(h('h2', null, 'Waiting for a grown-up'),
      h('ul', { class: 'swap-list' }, waiting.map((s) => h('li', null,
        h('b', null, `${fmt(s.reward)} ${reward}`), h('span', null, `${fmt(s.points)} points`)))));
  }
  const history = S().swaps.filter((s) => s.status === 'done').slice(-5).reverse();
  if (history.length) {
    body.push(h('h2', null, 'Swapped'),
      h('ul', { class: 'swap-list done' }, history.map((s) => h('li', null,
        h('b', null, `${fmt(s.reward)} ${reward}`),
        h('span', null, new Date(s.settled).toLocaleDateString())))));
  }

  screen.classList.add('swap-screen');
  screen.append(
    statusBar(),
    h('main', { class: 'page' },
      h('h1', null, `Swap for ${reward}`),
      h('p', { class: 'lead' }, 'Right answers earn points. Wrong answers cost a few. Save up and swap!'),
      ...body),
    bottomNav('/swap'),
  );
  return null;
}
