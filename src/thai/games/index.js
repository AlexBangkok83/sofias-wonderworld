import memory from './memory.js';
import listen from './listen.js';
import bubbles from './bubbles.js';
import read from './read.js';
import yesno from './yesno.js';
import sayit from './sayit.js';

/** In the order they appear on a chapter screen. */
export const GAMES = [memory, listen, bubbles, read, yesno, sayit];

/** Quiz games that work on any mix of words (Practice picks one at random). */
export const QUIZ_GAMES = [listen, bubbles, read, yesno];
export const gameById = (id) => GAMES.find((g) => g.id === id);
