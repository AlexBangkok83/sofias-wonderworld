/**
 * 📖 Learn: swipe through photo cards. Each card shows the picture with its
 * Thai spelling, pronunciation and meaning, says the word, and has a 🐢 button
 * for a slow replay and sometimes a fun fact.
 */

import { h, deco, sleep } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { CHAPTERS } from '../data/chapters.js';
import { card } from '../core/pictures.js';
import { say, stop, sfx } from '../core/audio.js';
import { isSeen, markSeen, chapterWords } from '../core/srs.js';
import { isUnlocked } from '../core/progress.js';
import { earn, markLearned, S, recordRound } from '../core/state.js';
import { go } from '../core/router.js';
import { gameFrame } from '../games/shell.js';
import { showResults } from './results.js';

export const NEW_CARD_POINTS = 2;

/** Marks a chapter learned once every one of its words has been seen. */
export function updateLearned(chapterId) {
  if (chapterWords(chapterId).every((w) => isSeen(w.id))) markLearned(chapterId);
}

/**
 * The card deck. Calls onFinish({ newCards, earned }) after the last card.
 */
export function learnDeck(screen, { words, title, exitTo, onFinish }) {
  let i = 0;
  let newCards = 0;
  let earned = 0;
  let alive = true;
  const frame = gameFrame(screen, { title, total: words.length, onQuit: () => go(exitTo) });
  const holder = h('div', { class: 'learn-holder' });
  const prev = h('button', { class: 'btn round-btn', 'aria-label': 'Previous', onClick: () => show(i - 1) }, '‹');
  const next = h('button', { class: 'btn primary next-btn', onClick: () => show(i + 1) }, 'Next');
  frame.body.append(holder, h('div', { class: 'learn-nav' }, prev, next));

  function show(n) {
    if (!alive) return;
    if (n < 0) return;
    if (n >= words.length) { finish(); return; }
    i = n;
    const word = words[i];
    if (!isSeen(word.id)) {
      newCards++;
      earned += frame.bonus(NEW_CARD_POINTS);
    }
    markSeen(word.id);
    frame.setProgress(i + 1);
    prev.disabled = i === 0;
    next.textContent = i === words.length - 1 ? 'Finish' : 'Next';
    const big = card(word, { class: 'learn-card' });
    big.addEventListener('click', () => say(word.th));
    holder.replaceChildren(
      big,
      h('div', { class: 'learn-audio' },
        h('button', { class: 'speaker-btn', 'aria-label': 'Hear it', onClick: () => say(word.th) }, deco(ICONS.speaker)),
        h('button', { class: 'slow-btn', 'aria-label': 'Hear it slowly', onClick: () => say(word.th, { slow: true }) }, deco(ICONS.turtle))),
      word.fact ? h('div', { class: 'fact' }, h('b', null, 'Did you know? '), word.fact) : null,
    );
    sfx('flip');
    setTimeout(() => alive && say(word.th), 200);
  }

  // Swipe left and right on phones.
  let startX = null;
  holder.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  holder.addEventListener('pointerup', (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 60) show(dx < 0 ? i + 1 : i - 1);
  });

  async function finish() {
    alive = false;
    stop();
    await sleep(100);
    onFinish({ newCards, earned });
  }

  show(0);
  return () => { alive = false; stop(); };
}

/** #/learn/:chapter */
export function learnRoute(screen, chapterId) {
  const index = CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = CHAPTERS[index];
  if (!chapter || !isUnlocked(index)) { go('/'); return null; }
  const words = chapterWords(chapter.id);
  return learnDeck(screen, {
    words,
    title: `Learn · ${chapter.title}`,
    exitTo: `/chapter/${chapter.id}`,
    onFinish: ({ newCards, earned }) => {
      const first = !S().chapters[chapter.id]?.learned;
      markLearned(chapter.id);
      const bonus = first ? earn(10) : 0;
      recordRound({ right: 0, wrong: 0 });
      showResults(screen, {
        title: `You met ${words.length} words!`,
        stars: 3,
        earned: earned + bonus,
        lost: 0,
        note: newCards ? `${newCards} new words. Now try a game to remember them.` : 'Now try a game to remember them.',
        onAgain: () => go(`/learn/${chapter.id}?again=${Date.now()}`),
        onDone: () => go(`/chapter/${chapter.id}`),
        doneLabel: 'Play a game',
      });
    },
  });
}
