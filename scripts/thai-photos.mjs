#!/usr/bin/env node
/**
 * Real photos for every word, from Pexels (and Pixabay as a second source).
 *
 *   PEXELS_API_KEY=... npm run thai:photos -- search     find 10 candidates per word
 *   npm run thai:photos -- sheets                        contact sheets to review: shots/photos-<chapter>.png
 *   npm run thai:photos -- download                      fetch the chosen photo for each word, crop, save
 *
 *   Options:  --chapter=farm    only one chapter
 *             --redo            search again even if candidates exist
 *   PIXABAY_API_KEY=...         also search Pixabay (good for hard-to-photograph words)
 *
 * Choosing: thai/photos/picks.json maps a word id to the candidate number
 * shown on its contact sheet, e.g. { "farm:cat": 3 }. Words without a pick
 * use candidate 1. Edit the file and run `download` again.
 *
 * Output: public/thai/img/<word>-<hash>.webp (480×480, about 30 KB each, cropped
 * on the most interesting part of the photo) and img/manifest.json with the
 * photographer credit for each. Files are named by content hash so caches never
 * show an old photo.
 *
 * Colours and numbers are drawn by the app and are skipped here.
 */

import { readFile, writeFile, mkdir, readdir, unlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { allWords, CHAPTERS } from '../src/thai/data/chapters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'thai', 'photos');
const CANDIDATES = path.join(DIR, 'candidates.json');
const PICKS = path.join(DIR, 'picks.json');
const IMG = path.join(ROOT, 'public', 'thai', 'img');
const MANIFEST = path.join(IMG, 'manifest.json');
const CREDITS = path.join(ROOT, 'thai', 'PHOTO-CREDITS.md');
const SHOTS = path.join(ROOT, 'shots');

const PEXELS = process.env.PEXELS_BASE_URL || 'https://api.pexels.com/v1';
const PIXABAY = process.env.PIXABAY_BASE_URL || 'https://pixabay.com/api';
const PER_SOURCE = 10;
const SIZE = 480;

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('--')) || 'help';
const only = (args.find((a) => a.startsWith('--chapter=')) || '').slice(10);
const redo = args.includes('--redo');

const exists = (p) => access(p).then(() => true, () => false);
const readJson = async (p, fallback) => ((await exists(p)) ? JSON.parse(await readFile(p, 'utf8')) : fallback);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Words that need a photo (colours and numbers are drawn). */
function photoWords() {
  return allWords().filter((w) => !w.swatch && w.n == null && (!only || w.chapter === only));
}

async function getJson(url, headers = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) { await sleep(2000 * 2 ** attempt); continue; }
    throw new Error(`HTTP ${res.status} from ${url.split('?')[0]}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function searchPexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const url = `${PEXELS}/search?query=${encodeURIComponent(query)}&per_page=${PER_SOURCE}&size=medium`;
  const data = await getJson(url, { Authorization: key });
  return (data.photos || []).map((p) => ({
    source: 'pexels',
    id: p.id,
    thumb: p.src.medium,
    full: p.src.large,
    by: p.photographer,
    byUrl: p.photographer_url,
    page: p.url,
    alt: p.alt || '',
  }));
}

async function searchPixabay(query) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const url = `${PIXABAY}/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=${PER_SOURCE}`;
  const data = await getJson(url);
  return (data.hits || []).map((p) => ({
    source: 'pixabay',
    id: p.id,
    thumb: p.webformatURL,
    full: p.largeImageURL,
    by: p.user,
    byUrl: `https://pixabay.com/users/${p.user}-${p.user_id}/`,
    page: p.pageURL,
    alt: p.tags || '',
  }));
}

async function search() {
  if (!process.env.PEXELS_API_KEY && !process.env.PIXABAY_API_KEY) {
    console.error('\n  Set PEXELS_API_KEY (free at pexels.com/api) and/or PIXABAY_API_KEY first.\n');
    process.exit(1);
  }
  await mkdir(DIR, { recursive: true });
  const all = await readJson(CANDIDATES, {});
  const words = photoWords().filter((w) => redo || !all[w.id]?.length);
  console.log(`\n  searching ${words.length} words…`);
  let n = 0;
  for (const w of words) {
    const query = w.q || w.en;
    const found = [...(await searchPexels(query)), ...(await searchPixabay(query))];
    all[w.id] = found;
    n++;
    process.stdout.write(`\r  ${n}/${words.length}  ${w.id.padEnd(30)} ${found.length} found`);
    await writeFile(CANDIDATES, JSON.stringify(all, null, 1));
    await sleep(250); // stay well inside Pexels' 200 requests an hour
  }
  process.stdout.write('\n');
  const empty = photoWords().filter((w) => !all[w.id]?.length);
  if (empty.length) console.log(`  no results for: ${empty.map((w) => w.id).join(', ')}. Give them a better q in chapters.js`);
  console.log('  ✓ candidates saved. Next: npm run thai:photos -- sheets\n');
}

/** One PNG per chapter: every word with its numbered candidates, for choosing. */
async function sheets() {
  const all = await readJson(CANDIDATES, {});
  const picks = await readJson(PICKS, {});
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await mkdir(SHOTS, { recursive: true });
  for (const chapter of CHAPTERS) {
    if (only && chapter.id !== only) continue;
    const words = photoWords().filter((w) => w.chapter === chapter.id && all[w.id]?.length);
    if (!words.length) continue;
    const rows = words.map((w) => {
      const chosen = picks[w.id] || 1;
      const cells = all[w.id].map((c, i) => `
        <figure class="${i + 1 === chosen ? 'chosen' : ''}"><img src="${c.thumb}"><figcaption>${i + 1}</figcaption></figure>`).join('');
      return `<section><h2>${w.id} <small>${w.en} · q: ${w.q || w.en}</small></h2><div class="row">${cells}</div></section>`;
    }).join('');
    await page.setContent(`<style>
      body{font:14px system-ui;margin:12px;background:#fff}
      h2{font-size:15px;margin:10px 0 4px} small{color:#777;font-weight:400}
      .row{display:flex;gap:6px;flex-wrap:wrap}
      figure{margin:0;position:relative;width:128px;height:128px;border:3px solid transparent}
      figure.chosen{border-color:#22a565}
      img{width:100%;height:100%;object-fit:cover}
      figcaption{position:absolute;left:2px;top:2px;background:#000c;color:#fff;padding:1px 6px;font-weight:700}
    </style>${rows}`, { waitUntil: 'networkidle' });
    const file = path.join(SHOTS, `photos-${chapter.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  📸 ${path.relative(ROOT, file)}`);
  }
  await browser.close();
}

async function download() {
  const all = await readJson(CANDIDATES, {});
  const picks = await readJson(PICKS, {});
  const manifest = await readJson(MANIFEST, { photos: {} });
  await mkdir(IMG, { recursive: true });
  const words = photoWords();
  let done = 0;
  const missing = [];
  for (const w of words) {
    const list = all[w.id] || [];
    const choice = list[(picks[w.id] || 1) - 1];
    if (!choice) { missing.push(w.id); continue; }
    const prev = manifest.photos[w.id];
    if (prev && prev.source === choice.source && prev.id === choice.id && (await exists(path.join(IMG, prev.file)))) continue;
    const res = await fetch(choice.full);
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${choice.full}`);
    const webp = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 74 })
      .toBuffer();
    const hash = createHash('sha1').update(webp).digest('hex').slice(0, 8);
    const file = `${w.id.replace(/[^a-z0-9]+/g, '-')}-${hash}.webp`;
    await writeFile(path.join(IMG, file), webp);
    manifest.photos[w.id] = { file, source: choice.source, id: choice.id, by: choice.by, byUrl: choice.byUrl, page: choice.page };
    done++;
    process.stdout.write(`\r  downloaded ${done}`);
  }
  if (done) process.stdout.write('\n');

  // Forget photos for words that no longer exist, and delete unused files.
  const ids = new Set(allWords().map((w) => w.id));
  for (const id of Object.keys(manifest.photos)) if (!ids.has(id)) delete manifest.photos[id];
  const used = new Set(Object.values(manifest.photos).map((p) => p.file));
  for (const f of await readdir(IMG)) if (f.endsWith('.webp') && !used.has(f)) await unlink(path.join(IMG, f));

  const sorted = Object.fromEntries(Object.entries(manifest.photos).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify({ photos: sorted }, null, 1) + '\n');
  await writeCredits(sorted);
  if (missing.length) console.log(`  no candidate for: ${missing.join(', ')}`);
  console.log(`  ✓ ${Object.keys(sorted).length} photos in public/thai/img/\n`);
}

async function writeCredits(photos) {
  const lines = [
    '# Photo credits',
    '',
    'Photos provided by [Pexels](https://www.pexels.com) and [Pixabay](https://pixabay.com).',
    'Generated by `npm run thai:photos -- download`.',
    '',
    '| Word | Photographer | Source |',
    '|---|---|---|',
    ...Object.entries(photos).map(([id, p]) => `| ${id} | [${p.by}](${p.byUrl}) | [${p.source}](${p.page}) |`),
    '',
  ];
  await writeFile(CREDITS, lines.join('\n'));
}

const commands = { search, sheets, download };
if (!commands[command]) {
  console.log('\n  npm run thai:photos -- search | sheets | download   (see the top of scripts/thai-photos.mjs)\n');
  process.exit(command === 'help' ? 0 : 1);
}
commands[command]().catch((err) => { console.error(`\n  ✗ ${err.message}\n`); process.exit(1); });
