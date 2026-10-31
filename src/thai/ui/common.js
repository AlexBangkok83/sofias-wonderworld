/** Pieces shared by the non-game screens: the status bar and the bottom tabs. */

import { h, deco, fmt } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { S, daysThisWeek, levelInfo, settings, pendingSwaps } from '../core/state.js';
import { go } from '../core/router.js';

export function statusBar() {
  const lv = levelInfo();
  return h('div', { class: 'status-bar' },
    h('button', { class: 'chip points-chip', onClick: () => go('/swap'), 'aria-label': 'Points' },
      deco(ICONS.star, 'chip-icon'), h('span', { class: 'points-num' }, fmt(S().wallet))),
    h('div', { class: 'chip', title: 'Days learned this week' },
      deco(ICONS.fire, 'chip-icon'), h('span', null, `${daysThisWeek()} `), h('small', null, 'this week')),
    h('div', { class: 'chip level-chip', title: `${lv.toNext} points to the next level` },
      h('span', { class: 'lv' }, `Lv ${lv.level}`),
      h('span', { class: 'lv-bar' }, h('span', { style: { width: `${Math.round(lv.progress * 100)}%` } }))));
}

const TABS = [
  ['/', ICONS.house, 'Learn'],
  ['/stickers', ICONS.sticker, 'Stickers'],
  ['/swap', ICONS.gem, () => settings().rewardName || 'Swap'],
  ['/parents', ICONS.gear, 'Grown-ups'],
];

export function bottomNav(active) {
  const waiting = pendingSwaps().length;
  return h('nav', { class: 'bottom-nav' },
    TABS.map(([path, icon, name]) => h('button', {
      class: `tab ${active === path ? 'active' : ''}`,
      onClick: () => go(path),
    },
    deco(icon, 'tab-icon'),
    h('span', null, typeof name === 'function' ? name() : name),
    path === '/parents' && waiting ? h('i', { class: 'badge' }, String(waiting)) : null)));
}

/** Header for a sub-screen: back arrow and a title. */
export function subHeader(title, backTo = '/', extra = null) {
  return h('header', { class: 'sub-header' },
    h('button', { class: 'icon-btn', 'aria-label': 'Back', onClick: () => go(backTo) }, '←'),
    h('h1', null, title),
    extra || h('span', { class: 'spacer' }));
}
