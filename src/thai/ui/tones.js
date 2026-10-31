/** #/tones: a round of Tone Twins, drawn from all ten pairs. */

import { allWords } from '../data/chapters.js';
import { TONE_PAIRS } from '../data/tone-pairs.js';
import { shuffle } from '../core/dom.js';
import { go } from '../core/router.js';
import tones from '../games/tones.js';
import { runGame } from './play.js';

export function tonesRoute(screen) {
  const byId = new Map(allWords().map((w) => [w.id, w]));
  const words = shuffle(TONE_PAIRS).map(([a, b, tip]) => {
    const [first, second] = Math.random() < 0.5 ? [a, b] : [b, a];
    return { ...byId.get(first), partner: byId.get(second), tip };
  });
  return runGame(screen, {
    game: tones,
    words,
    pool: [],
    title: 'Tone Twins',
    exitTo: '/',
    again: () => go(`/tones?again=${Date.now()}`),
  });
}
