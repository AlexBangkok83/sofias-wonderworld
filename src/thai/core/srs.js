/**
 * Spaced repetition: a Leitner box per word.
 *
 * Box 0 is "never answered". A right first-time answer moves a word up one
 * box, but only once it is due, so answering the same word ten times in one
 * sitting doesn't fake ten days of memory. A wrong answer drops it to box 1,
 * due again straight away. Box 3 and up counts as mastered, which takes at
 * least two separate days.
 */

import { S, save } from './state.js';
import { allWords } from '../data/chapters.js';
import { shuffle } from './dom.js';

const MIN = 60e3;
const DAY = 864e5;
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 21 * DAY];
export const MASTERED_BOX = 3;

const record = (id) => (S().words[id] ||= { box: 0, due: 0, seen: 0, right: 0, wrong: 0 });

export const box = (id) => S().words[id]?.box || 0;
export const isSeen = (id) => (S().words[id]?.seen || 0) > 0;
export const isMastered = (id) => box(id) >= MASTERED_BOX;
export const isDue = (id) => (S().words[id]?.due || 0) <= Date.now();

/** "Fresh" words pay full points: not yet mastered, or due for review. */
export const isFresh = (id) => !isMastered(id) || isDue(id);

export function markSeen(id) {
  const r = record(id);
  r.seen += 1;
  save();
}

export function grade(id, correct, firstTry) {
  const r = record(id);
  r.seen += 1;
  if (correct) {
    r.right += 1;
    if (firstTry && r.due <= Date.now()) {
      r.box = Math.min(INTERVALS.length - 1, Math.max(1, r.box + 1));
      r.due = Date.now() + INTERVALS[r.box];
    }
  } else {
    r.wrong += 1;
    r.box = 1;
    r.due = Date.now();
  }
  save();
}

/**
 * Chooses n words for a round: words due for review first, then new ones,
 * then ones still being learned, then mastered ones, shuffled within each group.
 */
export function pick(words, n) {
  const now = Date.now();
  const tier = (w) => {
    const r = S().words[w.id];
    if (!r || r.seen === 0) return 1;
    if (r.box < MASTERED_BOX && r.due <= now) return 0;
    if (r.box < MASTERED_BOX) return 2;
    return r.due <= now ? 0 : 3;
  };
  const groups = [[], [], [], []];
  for (const w of words) groups[tier(w)].push(w);
  return groups.flatMap(shuffle).slice(0, n);
}

/** Words in a chapter, with ids. */
export function chapterWords(chapterId) {
  return allWords().filter((w) => w.chapter === chapterId);
}

export function masteredCount(chapterId) {
  return chapterWords(chapterId).filter((w) => isMastered(w.id)).length;
}

/** Every word she has met in unlocked chapters, most in need of practice first. */
export function practicePool(unlockedIds) {
  const ids = new Set(unlockedIds);
  return allWords().filter((w) => ids.has(w.chapter) && isSeen(w.id));
}

export function dueCount(unlockedIds) {
  return practicePool(unlockedIds).filter((w) => isDue(w.id)).length;
}

