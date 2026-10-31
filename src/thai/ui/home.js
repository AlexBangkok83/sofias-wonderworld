/** Home: the mascot, today's goal, Today's Lesson, and the path of chapters. */

import { h, deco } from '../core/dom.js';
import { ICONS, CHAPTER_ICONS } from '../data/deco.js';
import { CHAPTERS, LANDS } from '../data/chapters.js';
import { GREETINGS } from '../data/greetings.js';
import { S, today, DAILY_GOAL, settings } from '../core/state.js';
import { stars, isUnlocked, frontier, unlockedChapters, UNLOCK_AT } from '../core/progress.js';
import { dueCount, masteredCount, chapterWords } from '../core/srs.js';
import { say } from '../core/audio.js';
import { go } from '../core/router.js';
import { statusBar, bottomNav } from './common.js';

function goalRing(earned) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, earned / DAILY_GOAL);
  // SVG has to be parsed as markup: createElement('svg') makes an HTML element that never draws.
  return h('div', { class: 'goal' },
    h('div', { html: `<svg viewBox="0 0 64 64" class="goal-ring">
      <circle cx="32" cy="32" r="${r}" class="goal-track"/>
      <circle cx="32" cy="32" r="${r}" class="goal-fill" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>` }),
    h('div', { class: 'goal-text' }, h('b', null, `${Math.min(earned, DAILY_GOAL)}`), h('small', null, `/${DAILY_GOAL}`)),
    h('div', { class: 'goal-label' }, p >= 1 ? 'Goal done!' : "Today's goal"));
}

function starRow(n) {
  return h('span', { class: 'mini-stars' }, [1, 2, 3].map((k) => h('i', { class: k <= n ? 'on' : '' }, '★')));
}

export function homeRoute(screen) {
  const day = today();
  const name = settings().name || 'Sofia';
  const current = frontier();
  const due = dueCount(unlockedChapters().map((c) => c.id));

  const hello = h('button', { class: 'mascot-card', onClick: () => say(GREETINGS[0].th) },
    deco(ICONS.mascot, 'mascot'),
    h('div', { class: 'bubble-text' },
      h('div', { class: 'th' }, `สวัสดีค่ะ ${name === 'Sofia' ? 'โซเฟีย' : name}!`),
      h('div', { class: 'rom' }, 'sà-wàt-dee kâ'),
      h('small', null, "I'm Khru Mali. Tap me!")),
    goalRing(day.earned));

  const actions = h('div', { class: 'home-actions' },
    h('button', { class: `big-action lesson ${day.lesson ? 'done' : ''}`, onClick: () => go('/lesson') },
      deco(ICONS.lesson, 'ba-icon'),
      h('div', null,
        h('b', null, day.lesson ? "Today's Lesson ✓" : "Today's Lesson"),
        h('small', null, day.lesson ? 'Done! Play again any time' : `4 new words from ${current.title} · 6 min`))),
    h('button', { class: 'big-action practice', onClick: () => go('/practice') },
      deco(ICONS.practice, 'ba-icon'),
      h('div', null,
        h('b', null, 'Practice'),
        h('small', null, due ? `${due} words ready to review` : 'Mix of everything you know'))));

  const path = [];
  let k = 0;
  for (const land of LANDS) {
    path.push(h('div', { class: 'land-banner', style: { '--land': land.color } },
      h('span', null, `Land ${land.id}`), h('b', null, land.name), h('i', null, land.th)));
    for (const chapter of CHAPTERS.filter((c) => c.land === land.id)) {
      const index = CHAPTERS.indexOf(chapter);
      const open = isUnlocked(index);
      const n = stars(chapter);
      const total = chapterWords(chapter.id).length;
      const side = ['left', 'mid', 'right', 'mid'][k++ % 4];
      path.push(h('button', {
        class: `node ${side} ${open ? 'open' : 'locked'} ${chapter === current ? 'current' : ''}`,
        style: { '--land': land.color },
        onClick: () => (open ? go(`/chapter/${chapter.id}`) : null),
        'aria-label': chapter.title,
      },
      h('span', { class: 'node-circle' },
        deco(CHAPTER_ICONS[chapter.id] || ICONS.books, 'node-icon'),
        open ? null : deco(ICONS.lock, 'node-lock')),
      h('span', { class: 'node-text' },
        h('b', null, `${index + 1}. ${chapter.title}`),
        h('i', { class: 'th' }, chapter.th),
        open
          ? h('span', { class: 'node-meta' }, starRow(n), h('small', null, `${masteredCount(chapter.id)}/${total} mastered`))
          : h('small', { class: 'node-meta' }, `Get ${UNLOCK_AT} ★ in chapter ${index} to open`))));
    }
  }

  screen.classList.add('home-screen');
  screen.append(
    statusBar(),
    h('main', { class: 'home-main' }, hello, actions, h('div', { class: 'path' }, path)),
    bottomNav('/'),
  );

  // Scroll the current chapter into view on a return visit.
  requestAnimationFrame(() => {
    const node = screen.querySelector('.node.current');
    if (node && S().lifetime > 0) node.scrollIntoView({ block: 'center' });
  });
  return null;
}
