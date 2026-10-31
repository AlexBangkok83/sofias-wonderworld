/** Chapter stars and unlocking, built from state and spaced repetition. */

import { CHAPTERS } from '../data/chapters.js';
import { S, chapterState, settings } from './state.js';
import { chapterWords, isMastered } from './srs.js';

export const UNLOCK_AT = 2;

/**
 * 0–3 stars for a chapter:
 *   1. finished the Learn deck
 *   2. finished any two games
 *   3. mastered every word (each recalled right on separate days)
 */
export function stars(chapter) {
  const c = S().chapters[chapter.id];
  if (!c) return 0;
  let n = 0;
  if (c.learned) n++;
  if (Object.keys(c.games).length >= 2) n++;
  if (chapterWords(chapter.id).every((w) => isMastered(w.id))) n++;
  return n;
}

export function isUnlocked(index) {
  if (index <= 0 || settings().unlockAll) return true;
  return stars(CHAPTERS[index - 1]) >= UNLOCK_AT;
}

export function unlockedChapters() {
  return CHAPTERS.filter((_, i) => isUnlocked(i));
}

/** The furthest chapter she can open: where Today's Lesson takes new words from. */
export function frontier() {
  let last = 0;
  CHAPTERS.forEach((_, i) => { if (isUnlocked(i)) last = i; });
  // Prefer the earliest unlocked chapter that still has words she hasn't learned.
  for (let i = 0; i <= last; i++) {
    if (!chapterState(CHAPTERS[i].id).learned) return CHAPTERS[i];
  }
  return CHAPTERS[last];
}
