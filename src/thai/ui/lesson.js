/**
 * 🎒 Today's Lesson, about six minutes:
 *   1. four new words from the chapter she's on (Learn cards)
 *   2. Listen & Find with those words plus up to four due for review
 *   3. a clear finish: "see you tomorrow"
 */

import { chapterWords, pick, practicePool, isSeen, isDue } from '../core/srs.js';
import { frontier, unlockedChapters } from '../core/progress.js';
import { today, earn, save } from '../core/state.js';
import { shuffle } from '../core/dom.js';
import { go } from '../core/router.js';
import { gameById } from '../games/index.js';
import { learnDeck, updateLearned } from './learn.js';
import { runGame } from './play.js';
import { GREETINGS } from '../data/greetings.js';
import { say } from '../core/audio.js';

const NEW_WORDS = 4;
const LESSON_BONUS = 20;

export function lessonRoute(screen) {
  const chapter = frontier();
  const own = chapterWords(chapter.id);
  const unseen = own.filter((w) => !isSeen(w.id));
  const fresh = unseen.length ? unseen.slice(0, NEW_WORDS) : pick(own, NEW_WORDS);
  const others = unlockedChapters().map((c) => c.id).filter((id) => id !== chapter.id);
  const review = pick(practicePool(others), NEW_WORDS).filter((w) => isDue(w.id));

  let cleanup = learnDeck(screen, {
    words: fresh,
    title: `Today's Lesson · ${chapter.title}`,
    exitTo: '/',
    onFinish: ({ earned: learnPoints }) => {
      updateLearned(chapter.id);
      // New words come up twice, review words once, never the same word twice in a row.
      const firstPass = shuffle([...fresh, ...review]);
      const secondPass = shuffle(fresh);
      if (secondPass.length > 1 && secondPass[0].id === firstPass[firstPass.length - 1].id) secondPass.push(secondPass.shift());
      const targets = [...firstPass, ...secondPass].slice(0, 8);
      screen.replaceChildren();
      screen.className = 'screen';
      cleanup = runGame(screen, {
        game: gameById('listen'),
        words: targets,
        pool: [...own, ...review],
        title: "Today's Lesson · Listen & Find",
        exitTo: '/',
        after: (result) => {
          const day = today();
          const first = !day.lesson;
          day.lesson = true;
          save();
          const bonus = first ? earn(LESSON_BONUS) : 0;
          setTimeout(() => say(GREETINGS[3].th), 1600);
          return {
            ...result,
            title: 'Lesson complete!',
            earned: result.earned + learnPoints + bonus,
            note: first
              ? `+${LESSON_BONUS} for today's lesson. See you tomorrow! (You can keep playing too.)`
              : 'See you tomorrow! (You can keep playing too.)',
            onAgain: null,
            onDone: () => go('/'),
          };
        },
      });
    },
  });
  return () => cleanup && cleanup();
}
