/** A chapter: its words, its stars, the Learn deck and the games. */

import { h, deco } from '../core/dom.js';
import { ICONS, CHAPTER_ICONS } from '../data/deco.js';
import { CHAPTERS, LANDS } from '../data/chapters.js';
import { GAMES } from '../games/index.js';
import { chapterState } from '../core/state.js';
import { stars, isUnlocked, UNLOCK_AT } from '../core/progress.js';
import { chapterWords, box, isMastered, MASTERED_BOX } from '../core/srs.js';
import { picture, label } from '../core/pictures.js';
import { say } from '../core/audio.js';
import { go } from '../core/router.js';
import { statusBar, subHeader } from './common.js';

export function chapterRoute(screen, chapterId) {
  const index = CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = CHAPTERS[index];
  if (!chapter || !isUnlocked(index)) { go('/'); return null; }
  const land = LANDS.find((l) => l.id === chapter.land);
  const state = chapterState(chapter.id);
  const n = stars(chapter);
  const words = chapterWords(chapter.id);
  const next = CHAPTERS[index + 1];

  const goals = h('ol', { class: 'star-goals' },
    h('li', { class: state.learned ? 'done' : '' }, '★ Finish the Learn cards'),
    h('li', { class: Object.keys(state.games).length >= 2 ? 'done' : '' }, `★ Finish any 2 games (${Math.min(2, Object.keys(state.games).length)}/2)`),
    h('li', { class: n === 3 || words.every((w) => isMastered(w.id)) ? 'done' : '' },
      '★ Master every word (remember it on different days)'));

  const games = h('div', { class: 'game-grid' }, GAMES.map((g) => {
    const best = state.games[g.id] || 0;
    return h('button', { class: 'game-tile', onClick: () => go(`/play/${chapter.id}/${g.id}`) },
      deco(g.icon, 'gt-icon'),
      h('b', null, g.name),
      h('small', null, g.blurb),
      h('span', { class: 'mini-stars' }, [1, 2, 3].map((k) => h('i', { class: k <= best ? 'on' : '' }, '★'))));
  }));

  const list = h('div', { class: 'word-grid' }, words.map((w) => {
    const b = box(w.id);
    return h('button', { class: `word-mini ${isMastered(w.id) ? 'mastered' : ''}`, onClick: () => say(w.th) },
      picture(w),
      label(w),
      h('span', { class: 'strength', title: 'How well you know it' },
        Array.from({ length: MASTERED_BOX }, (_, k) => h('i', { class: k < b ? 'on' : '' }))));
  }));

  screen.classList.add('chapter-screen');
  screen.style.setProperty('--land', land.color);
  screen.append(
    statusBar(),
    subHeader(`${index + 1}. ${chapter.title}`, '/'),
    h('main', { class: 'chapter-main' },
      h('div', { class: 'chapter-hero' },
        deco(CHAPTER_ICONS[chapter.id] || ICONS.books, 'hero-icon'),
        h('div', null,
          h('div', { class: 'hero-th' }, chapter.th),
          h('div', { class: 'hero-stars' }, [1, 2, 3].map((k) => deco(ICONS.star, k <= n ? 'on' : 'off'))),
          next && n < UNLOCK_AT ? h('small', null, `${UNLOCK_AT} stars opens “${next.title}”`) : null)),
      goals,
      h('button', { class: 'big-action learn', onClick: () => go(`/learn/${chapter.id}`) },
        deco(ICONS.learn, 'ba-icon'),
        h('div', null, h('b', null, 'Learn the words'), h('small', null, `${words.length} picture cards with sound`))),
      h('h2', null, 'Games'),
      games,
      h('h2', null, 'Words in this chapter'),
      h('p', { class: 'hint' }, 'Tap a word to hear it.'),
      list),
  );
  return null;
}
