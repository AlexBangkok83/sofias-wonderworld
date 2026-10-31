#!/usr/bin/env node
/**
 * Fast checks over the Thai app's data, no browser (about a second):
 * every word complete and unique, every chapter big enough for its games,
 * every line has a voice clip on disk, every photo and decoration file exists.
 *
 *   npm run thai:check
 */

import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS, LANDS, PRAISE, TRY_AGAIN, allWords } from '../src/thai/data/chapters.js';
import { GREETINGS } from '../src/thai/data/greetings.js';
import { ICONS, CHAPTER_ICONS, STICKERS, SHINY_STICKERS, decoFile } from '../src/thai/data/deco.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, '..', 'public', 'thai');
const exists = (p) => access(p).then(() => true, () => false);

const errors = [];
const warnings = [];
const words = allWords();

// Words
const ids = new Set();
for (const w of words) {
  if (ids.has(w.id)) errors.push(`duplicate word id ${w.id}`);
  ids.add(w.id);
  for (const field of ['th', 'rom', 'en']) if (!w[field]?.trim()) errors.push(`${w.id} has no ${field}`);
  if (/[^฀-๿ ]/.test(w.th)) errors.push(`${w.id}: Thai text has non-Thai characters: ${w.th}`);
  if (/[฀-๿]/.test(w.rom)) errors.push(`${w.id}: pronunciation contains Thai script`);
}

// Chapters: Memory needs 6 words, Listen & Find needs 4 choices.
for (const c of CHAPTERS) {
  if (c.words.length < 8) errors.push(`chapter ${c.id} has ${c.words.length} words; games need at least 8`);
  if (!LANDS.some((l) => l.id === c.land)) errors.push(`chapter ${c.id} is in unknown land ${c.land}`);
  if (!CHAPTER_ICONS[c.id]) errors.push(`chapter ${c.id} has no badge in CHAPTER_ICONS`);
  const th = c.words.map((w) => w.th);
  const dup = th.filter((t, i) => th.indexOf(t) !== i);
  if (dup.length) errors.push(`chapter ${c.id} repeats ${dup.join(', ')}`);
}

// Voice clips
const audio = JSON.parse(await readFile(path.join(PUB, 'audio', 'manifest.json'), 'utf8')).clips || {};
const lines = new Set([...words, ...PRAISE, ...TRY_AGAIN, ...GREETINGS].map((w) => w.th));
for (const th of lines) {
  const clip = audio[th];
  if (!clip) { warnings.push(`no voice clip for ${th} (run npm run thai:audio)`); continue; }
  if (!(await exists(path.join(PUB, 'audio', clip.file)))) errors.push(`voice clip missing on disk: ${clip.file} (${th})`);
  if (clip.ok === false) warnings.push(`voice clip for ${th} needs a human listen (transcribed as "${clip.heard}")`);
}

// Photos
const photos = JSON.parse(await readFile(path.join(PUB, 'img', 'manifest.json'), 'utf8')).photos || {};
let photoMissing = 0;
for (const w of words) {
  if (w.swatch || w.n != null) continue;
  const p = photos[w.id];
  if (!p) { photoMissing++; continue; }
  if (!(await exists(path.join(PUB, 'img', p.file)))) errors.push(`photo missing on disk: ${p.file}`);
}
if (photoMissing) warnings.push(`${photoMissing} words still need a picture (run npm run thai:pictures -- import)`);

// Decoration
for (const emoji of new Set([...Object.values(ICONS), ...Object.values(CHAPTER_ICONS), ...STICKERS.map((s) => s[1]), ...SHINY_STICKERS.map((s) => s[1])])) {
  if (!(await exists(path.join(PUB, 'deco', decoFile(emoji))))) errors.push(`decoration ${emoji} missing (run npm run thai:deco)`);
}

const clipCount = [...lines].filter((t) => audio[t]).length;
console.log(`\n  ${CHAPTERS.length} chapters · ${words.length} words · ${clipCount}/${lines.size} voice clips · ${Object.keys(photos).length} photos`);
for (const w of warnings.slice(0, 12)) console.log(`  ! ${w}`);
if (warnings.length > 12) console.log(`  ! …and ${warnings.length - 12} more`);
if (errors.length) {
  console.error(`\n  ✗ ${errors.length} problem(s):\n${errors.map((e) => `    - ${e}`).join('\n')}\n`);
  process.exit(1);
}
console.log('  ✓ Thai data checks passed\n');
