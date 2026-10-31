/**
 * What every game shares: the top bar (quit, progress, points), the scoring
 * rules, and handing off to the results screen.
 *
 * Scoring:
 *   right first time   +10 (+4 if the word is already mastered and not due,
 *                           so replaying easy words isn't a points farm)
 *   right on a retry   +3
 *   wrong              − penalty (grown-up setting, default 2)
 *   5 right in a row   +10 combo
 *   finishing a round  +20, or +30 if perfect, shrinking on repeat plays
 *                      of the same game on the same day
 */

import { h, deco, flash, fmt } from '../core/dom.js';
import { ICONS } from '../data/deco.js';
import { S, earn, lose, settings, capReached } from '../core/state.js';
import { grade, isFresh } from '../core/srs.js';
import { say, sfx, praise, stop } from '../core/audio.js';

export const RIGHT_FIRST = 10;
export const RIGHT_EASY = 4;
export const RIGHT_RETRY = 3;
export const COMBO_EVERY = 5;
export const COMBO_BONUS = 10;

/**
 * Test hooks, active only with ?test in the URL: the smoke test reads the
 * current answer from window.__thai and finds choices by data-test-id.
 */
const TEST = new URLSearchParams(location.search).has('test');
export const testHook = { answer: null };
if (TEST) window.__thai = testHook;
export function tag(el, id) {
  if (TEST) el.dataset.testId = id;
  return el;
}

/**
 * Builds the game frame inside `screen`.
 * Returns helpers for the game to report right/wrong and to finish.
 */
export function gameFrame(screen, { title, total, onQuit }) {
  const progressFill = h('div', { class: 'progress-fill' });
  const pointsEl = h('span', { class: 'points-num' }, fmt(S().wallet));
  const pointsChip = h('div', { class: 'chip points-chip' }, deco(ICONS.star, 'chip-icon'), pointsEl);
  const body = h('div', { class: 'game-body' });

  screen.classList.add('game-screen');
  screen.append(
    h('div', { class: 'game-top' },
      h('button', { class: 'icon-btn quit', 'aria-label': 'Quit', onClick: onQuit }, '✕'),
      h('div', { class: 'progress' }, progressFill),
      pointsChip),
    h('div', { class: 'game-title' }, title),
    body,
  );

  const tally = {
    right: 0,          // answered right first time
    retried: 0,        // answered right after a miss
    wrong: 0,          // wrong taps
    earned: 0,
    lost: 0,
    streak: 0,
    missed: new Set(), // word ids missed this round
  };

  function float(text, kind, anchor) {
    const el = h('div', { class: `float ${kind}` }, text);
    const box = (anchor || pointsChip).getBoundingClientRect();
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top}px`;
    document.body.append(el);
    setTimeout(() => el.remove(), 1100);
  }

  function refreshPoints() {
    pointsEl.textContent = fmt(S().wallet);
    flash(pointsChip, 'bump', 400);
  }

  return {
    body,
    tally,
    setProgress(done) {
      progressFill.style.width = `${Math.min(100, (done / total) * 100)}%`;
    },
    /** A right answer. Returns points awarded. */
    right(word, anchor) {
      const first = !tally.missed.has(word.id);
      const pts = first ? (isFresh(word.id) ? RIGHT_FIRST : RIGHT_EASY) : RIGHT_RETRY;
      grade(word.id, true, first);
      if (first) { tally.right++; tally.streak++; } else { tally.retried++; tally.streak = 0; }
      let got = earn(pts);
      if (first && tally.streak > 0 && tally.streak % COMBO_EVERY === 0) {
        got += earn(COMBO_BONUS);
        float(`${tally.streak} in a row!`, 'combo', anchor);
      }
      tally.earned += got;
      if (got > 0) float(`+${got}`, 'plus', anchor);
      else if (capReached()) float('Daily max reached', 'combo', anchor);
      sfx('correct');
      refreshPoints();
      return got;
    },
    /** A wrong answer: a few points off, the word goes back into practice. */
    wrong(word, anchor) {
      tally.wrong++;
      tally.streak = 0;
      if (!tally.missed.has(word.id)) grade(word.id, false, false);
      tally.missed.add(word.id);
      const taken = lose(settings().penalty);
      tally.lost += taken;
      if (taken > 0) float(`−${taken}`, 'minus', anchor);
      sfx('wrong');
      refreshPoints();
    },
    /** Points with no word attached (memory pairs, bonuses). */
    bonus(pts, anchor) {
      const got = earn(pts);
      tally.earned += got;
      if (got > 0) float(`+${got}`, 'plus', anchor);
      refreshPoints();
      return got;
    },
    say,
    praise,
    stop,
  };
}

/** 3 stars at 90% right first time, 2 at 60%, otherwise 1. */
export function starsFor(tally, total) {
  const ratio = total ? tally.right / total : 0;
  return ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
}

/** End-of-round bonus, halved for each repeat of the same game today. */
export function finishBonus(stars, repeats) {
  const base = stars === 3 ? 30 : 20;
  return Math.round(base / 2 ** Math.min(repeats, 4));
}

/** Words to offer as wrong answers: never the same Thai, English or picture. */
export function distractors(target, pool, k) {
  const seen = new Set([target.th, target.en]);
  const out = [];
  for (const w of [...pool].sort(() => Math.random() - 0.5)) {
    if (w.id === target.id || seen.has(w.th) || seen.has(w.en)) continue;
    seen.add(w.th);
    seen.add(w.en);
    out.push(w);
    if (out.length === k) break;
  }
  return out;
}
