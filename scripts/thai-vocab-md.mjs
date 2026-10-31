#!/usr/bin/env node
/**
 * Writes thai/VOCABULARY.md from src/thai/data/chapters.js, so the word list
 * can be read and reviewed (by a parent, or a Thai speaker checking it)
 * without opening code. Never edit the markdown by hand.
 *
 *   npm run thai:vocab
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS, LANDS, ROMANISATION_NOTE, allWords, wordId } from '../src/thai/data/chapters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'thai', 'VOCABULARY.md');

const esc = (s) => String(s).replace(/\|/g, '\\|');

// Ids must be unique, or progress for two words would share one save slot.
const seen = new Map();
for (const chapter of CHAPTERS) {
  for (const word of chapter.words) {
    const id = wordId(chapter, word);
    if (seen.has(id)) throw new Error(`Duplicate word id ${id}`);
    seen.set(id, word);
  }
}

const total = allWords().length;
const lines = [
  '# Thai vocabulary',
  '',
  `Generated from \`src/thai/data/chapters.js\` by \`npm run thai:vocab\`. Do not edit by hand.`,
  '',
  `**${CHAPTERS.length} chapters, ${total} words and phrases.** ${ROMANISATION_NOTE}`,
  '',
];

for (const land of LANDS) {
  const chapters = CHAPTERS.filter((c) => c.land === land.id);
  lines.push(`## Land ${land.id}: ${land.name} (${land.th})`, '');
  for (const chapter of chapters) {
    const n = CHAPTERS.indexOf(chapter) + 1;
    lines.push(`### ${n}. ${chapter.title} (${chapter.th}), ${chapter.words.length} words`, '');
    lines.push('| Thai | Say it | English | Fun fact |', '|---|---|---|---|');
    for (const word of chapter.words) {
      lines.push(`| ${esc(word.th)} | ${esc(word.rom)} | ${esc(word.en)} | ${esc(word.fact || '')} |`);
    }
    lines.push('');
  }
}

await writeFile(OUT, lines.join('\n'));
console.log(`  ✓ ${path.relative(process.cwd(), OUT)}: ${CHAPTERS.length} chapters, ${total} words`);
