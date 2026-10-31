#!/usr/bin/env node
/**
 * Pre-renders every Thai word, phrase and praise line with OpenAI
 * text-to-speech, into public/thai/audio/, and writes a manifest the app
 * reads at startup.
 *
 *   OPENAI_API_KEY=sk-... npm run thai:audio            render what's new or changed
 *   OPENAI_API_KEY=sk-... npm run thai:audio -- --check  also transcribe every clip back
 *                                                         and flag ones that don't match
 *   ... -- --check --retry=3 re-render any clip that fails the check, up to 3
 *                            more times, keeping the first take that passes
 *   ... -- --only=ไก่,ไข่    re-render just these lines
 *   ... -- --force           re-render everything
 *
 * Why pre-render rather than call the API from the app: the text is fixed, so
 * one render serves every play. No key in the browser, no wait mid-game, no
 * per-play cost. Files are named by a hash of their text and voice settings,
 * so changing a word (or the voice) re-renders exactly that line and nothing
 * else.
 *
 * Settings (env vars, all optional):
 *   OPENAI_TTS_MODEL          default gpt-4o-mini-tts
 *   OPENAI_TTS_VOICE          default marin (scored best on a tone-pair test: 17/18 vs coral 13/18)
 *   OPENAI_TRANSCRIBE_MODEL   default gpt-transcribe
 *   OPENAI_BASE_URL           default https://api.openai.com/v1 (tests point it at a mock)
 */

import { readFile, writeFile, mkdir, access, unlink, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS, PRAISE, TRY_AGAIN } from '../src/thai/data/chapters.js';
import { GREETINGS } from '../src/thai/data/greetings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'thai', 'audio');
const MANIFEST = path.join(OUT, 'manifest.json');

const API = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'marin';
const TRANSCRIBE = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-transcribe';
// Single words are hard to transcribe with no context; telling the model what
// to expect ("one Thai word or short phrase a teacher says to a child") stops
// it guessing Chinese or Japanese for one syllable.
const TRANSCRIBE_PROMPT = 'คำภาษาไทยหนึ่งคำหรือวลีสั้นๆ ที่ครูพูดกับเด็ก';
const INSTRUCTIONS = [
  'You are a warm, cheerful native Thai teacher from Bangkok speaking to a 7-year-old girl.',
  'Speak standard central Thai. Say the text exactly as written, once, and nothing else.',
  'Speak clearly and a little slowly so a child can copy you, and pronounce every tone precisely.',
  'If the text is a single word, say it naturally as a word on its own, not as a question.',
].join(' ');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const FORCE = args.includes('--force');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const RETRY = Number((args.find((a) => a.startsWith('--retry=')) || '--retry=0').slice(8)) || 0;

/**
 * Spellings a transcriber writes differently from us that are still the same
 * word: loanwords and a common tone-mark variant. Anything not listed has to
 * match exactly.
 */
const SAME_WORD = {
  'สตรอว์เบอร์รี่': ['สตรอเบอร์รี่', 'สตรอเบอรี่'],
  'เฟรนช์ฟรายส์': ['frenchfries', 'เฟรนช์ฟราย', 'เฟรนช์ฟรายด์'],
  'ตุ๊กตุ๊ก': ['ตุ๊กตุก'],
  'บ๊ายบาย': ['บายบาย'],
  // Homophones: different spelling, identical sound and tone.
  'ผึ้ง': ['พึ่ง'],
  'พู่กัน': ['ผู้กัน'],
};
const CONCURRENCY = 4;

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Everything the app can say, deduplicated by text. */
function allLines() {
  const lines = new Map();
  for (const chapter of CHAPTERS) for (const w of chapter.words) lines.set(w.th, w.rom);
  for (const w of [...PRAISE, ...TRY_AGAIN, ...GREETINGS]) lines.set(w.th, w.rom);
  return [...lines].map(([th, rom]) => ({ th, rom }));
}

function hashFor(text) {
  return createHash('sha1').update([MODEL, VOICE, INSTRUCTIONS, text].join('\u0000')).digest('hex').slice(0, 12);
}

/** fetch with retries on rate limits and server errors. */
async function call(url, init, what) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    const body = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    throw new Error(`${what}: HTTP ${res.status} ${body.slice(0, 300)}`);
  }
}

async function render(text) {
  const res = await call(`${API}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, instructions: INSTRUCTIONS, response_format: 'mp3' }),
  }, `speech for "${text}"`);
  return Buffer.from(await res.arrayBuffer());
}

async function transcribe(file) {
  const form = new FormData();
  form.append('file', new Blob([await readFile(file)], { type: 'audio/mpeg' }), path.basename(file));
  form.append('model', TRANSCRIBE);
  form.append('language', 'th');
  form.append('prompt', TRANSCRIBE_PROMPT);
  const res = await call(`${API}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  }, `transcription of ${path.basename(file)}`);
  return (await res.json()).text || '';
}

/** Compare ignoring spaces, punctuation and the polite particles a transcriber may add or drop. */
function normalise(s) {
  return s.toLowerCase().replace(/[\s.,!?ๆฯ"'“”…]/g, '').replace(/(ค่ะ|คะ|ครับ|นะ)$/g, '');
}

function sounds(th, heard) {
  const h = normalise(heard);
  return h === normalise(th) || (SAME_WORD[th] || []).some((alt) => normalise(alt) === h);
}

async function checkClip(th, clip) {
  clip.heard = await transcribe(path.join(OUT, clip.file));
  clip.ok = sounds(th, clip.heard);
  return clip.ok;
}

async function pool(items, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

async function main() {
  if (!KEY) {
    console.error('\n  Set OPENAI_API_KEY first:  OPENAI_API_KEY=sk-... npm run thai:audio\n');
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const manifest = (await exists(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  const clips = manifest.clips || {};
  const lines = allLines();

  const todo = [];
  for (const line of lines) {
    const hash = hashFor(line.th);
    const file = `${hash}.mp3`;
    const prev = clips[line.th];
    const have = prev?.hash === hash && (await exists(path.join(OUT, prev.file)));
    const wanted = ONLY.length ? ONLY.includes(line.th) : FORCE || !have;
    if (wanted) todo.push({ ...line, hash, file });
  }

  console.log(`\n  ${lines.length} lines, ${todo.length} to render (${MODEL}, voice ${VOICE})`);
  let done = 0;
  await pool(todo, async (line) => {
    const audio = await render(line.th);
    await writeFile(path.join(OUT, line.file), audio);
    clips[line.th] = { file: line.file, hash: line.hash, rom: line.rom };
    done++;
    process.stdout.write(`\r  rendered ${done}/${todo.length}`);
  });
  if (todo.length) process.stdout.write('\n');

  // Drop manifest entries and files for lines that no longer exist.
  const keep = new Set(lines.map((l) => l.th));
  for (const th of Object.keys(clips)) if (!keep.has(th)) delete clips[th];
  const used = new Set(Object.values(clips).map((c) => c.file));
  for (const f of await readdir(OUT)) {
    if (f.endsWith('.mp3') && !used.has(f)) await unlink(path.join(OUT, f));
  }

  if (CHECK) {
    const targets = Object.entries(clips).filter(([th]) => !ONLY.length || ONLY.includes(th));
    console.log(`  checking ${targets.length} clips with ${TRANSCRIBE}…`);
    let checked = 0;
    await pool(targets, async ([th, clip]) => {
      await checkClip(th, clip);
      checked++;
      process.stdout.write(`\r  checked ${checked}/${targets.length}`);
    });
    process.stdout.write('\n');

    // Each take is a fresh roll of the dice, so a failed clip often passes on
    // a second try. A retake gets a new file name so no cache serves the old one.
    const failed = Object.entries(clips).filter(([, c]) => c.ok === false);
    if (RETRY && failed.length) {
      console.log(`  retrying ${failed.length} clips, up to ${RETRY} more takes each…`);
      let fixed = 0;
      await pool(failed, async ([th, clip]) => {
        for (let take = 2; take <= RETRY + 1; take++) {
          const candidate = { ...clip, file: `${clip.hash}-t${take}.mp3` };
          await writeFile(path.join(OUT, candidate.file), await render(th));
          if (await checkClip(th, candidate)) {
            await unlink(path.join(OUT, clip.file)).catch(() => {});
            Object.assign(clip, candidate);
            fixed++;
            return;
          }
          await unlink(path.join(OUT, candidate.file)).catch(() => {});
        }
      });
      console.log(`  ${fixed} fixed by a retake`);
    }
    const bad = Object.entries(clips).filter(([, c]) => c.ok === false);
    if (bad.length) {
      console.log(`\n  ${bad.length} clips didn't transcribe back to the same text. Listen to these:`);
      for (const [th, c] of bad) console.log(`    ${th.padEnd(18)} heard: ${c.heard}   (${c.file})`);
    } else {
      console.log('  every clip transcribed back to its own text');
    }
  }

  const sorted = Object.fromEntries(Object.entries(clips).sort(([a], [b]) => a.localeCompare(b, 'th')));
  await writeFile(MANIFEST, JSON.stringify({ model: MODEL, voice: VOICE, clips: sorted }, null, 1) + '\n');
  console.log(`  ✓ ${Object.keys(sorted).length} clips in public/thai/audio/\n`);
}

main().catch((err) => {
  console.error(`\n  ✗ ${err.message}\n`);
  process.exit(1);
});
