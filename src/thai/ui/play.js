/**
 * Runs a game round from start to results, for a chapter, for practice, or
 * as the second half of Today's Lesson.
 */

import { CHAPTERS } from '../data/chapters.js';
import { gameById, GAMES } from '../games/index.js';
import { gameFrame, starsFor, finishBonus } from '../games/shell.js';
import { chapterWords, pick, practicePool } from '../core/srs.js';
import { unlockedChapters, isUnlocked } from '../core/progress.js';
import {
  S, levelInfo, claimStickers, maybeShiny, recordGame, recordRound, playsToday, earn,
} from '../core/state.js';
import { stop } from '../core/audio.js';
import { go } from '../core/router.js';
import { toast, shuffle } from '../core/dom.js';
import { showResults } from './results.js';

/**
 * game, words (this round's targets), pool (wrong-answer candidates),
 * title, chapterId (null for practice), exitTo, after (optional hook that can
 * change the results, used by Today's Lesson).
 */
export function runGame(screen, opts) {
  const { game, words, pool, title, chapterId = null, exitTo, again, after } = opts;
  const levelBefore = levelInfo().level;
  let cleanup = null;
  let finished = false;

  const frame = gameFrame(screen, { title, total: words.length, onQuit: () => go(exitTo) });

  function done(extra = {}) {
    if (finished) return;
    finished = true;
    if (cleanup) cleanup();
    stop();
    const total = extra.total ?? words.length;
    const stars = extra.stars ?? starsFor(frame.tally, total);
    const perfect = stars === 3 && frame.tally.wrong === 0;
    const repeats = chapterId ? playsToday(chapterId, game.id) : 0;
    const bonus = earn(finishBonus(perfect ? 3 : stars, repeats));
    recordRound(frame.tally);
    if (chapterId) recordGame(chapterId, game.id, stars);

    const stickers = claimStickers();
    if (perfect) {
      const shiny = maybeShiny();
      if (shiny) stickers.push(shiny);
    }
    const levelAfter = levelInfo().level;
    let result = {
      title: perfect ? 'Perfect!' : stars === 3 ? 'Amazing!' : stars === 2 ? 'Great job!' : 'Good try!',
      stars,
      perfect,
      earned: frame.tally.earned + bonus,
      lost: frame.tally.lost,
      stickers,
      levelUp: levelAfter > levelBefore ? levelAfter : null,
      onAgain: again,
      onDone: () => go(exitTo),
    };
    if (after) result = after(result) || result;
    showResults(screen, result);
  }

  cleanup = game.play({ frame, words, pool, done });
  return () => { if (cleanup) cleanup(); stop(); };
}

/** #/play/:chapter/:game */
export function chapterGameRoute(screen, chapterId, gameId) {
  const index = CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = CHAPTERS[index];
  const game = gameById(gameId);
  if (!chapter || !game || !isUnlocked(index)) { go('/'); return null; }

  const own = chapterWords(chapter.id);
  let words;
  let pool = own;
  if (game.id === 'memory') {
    words = pick(own, game.rounds);
  } else {
    // Slip in up to two words due for review from earlier chapters.
    const earlier = new Set(CHAPTERS.slice(0, index).map((c) => c.id));
    const review = pick(practicePool([...earlier]), 2).filter((w) => S().words[w.id]?.due <= Date.now());
    words = shuffle([...pick(own, game.rounds - review.length), ...review]);
    pool = [...own, ...review];
  }
  return runGame(screen, {
    game, words, pool, chapterId: chapter.id,
    title: `${game.name} · ${chapter.title}`,
    exitTo: `/chapter/${chapter.id}`,
    again: () => go(`/play/${chapter.id}/${game.id}?again=${Date.now()}`),
  });
}

/** #/practice: due words from every unlocked chapter, in a random quiz game. */
export function practiceRoute(screen) {
  const pool = practicePool(unlockedChapters().map((c) => c.id));
  if (pool.length < 4) {
    toast('Learn a few words first, then come back to practise!');
    go('/');
    return null;
  }
  const choices = GAMES.filter((g) => g.id !== 'memory');
  const game = choices[Math.floor(Math.random() * choices.length)];
  return runGame(screen, {
    game,
    words: pick(pool, Math.min(game.rounds, pool.length)),
    pool,
    title: `Practice · ${game.name}`,
    exitTo: '/',
    again: () => go(`/practice?again=${Date.now()}`),
  });
}
