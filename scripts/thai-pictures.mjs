#!/usr/bin/env node
/**
 * The word pictures: generated images (GPT Image 2.5 on Higgsfield), one per
 * word, from the prompts in src/thai/data/picture-prompts.js.
 *
 * Generation happens through the Higgsfield tools (no API key in this repo).
 * Each finished job's result URL is recorded in thai/photos/generated.json as
 *   { "<word id>": { "job": "<job id>", "url": "https://…png" } }
 * and this script takes it from there:
 *
 *   npm run thai:pictures -- import    download, crop to 480×480 WebP, write img/manifest.json
 *   npm run thai:pictures -- sheets    contact sheets for review: shots/pictures-<chapter>.png
 *
 *   --chapter=farm   only one chapter
 *   --force          re-download even if a word already has its picture
 *
 * To redo a picture: change its prompt, generate again, put the new job and
 * URL in generated.json, and run import. Files are named by content hash, so
 * no cache ever shows the old one.
 */

import { readFile, writeFile, mkdir, readdir, unlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { allWords, CHAPTERS } from '../src/thai/data/chapters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const GENERATED = path.join(ROOT, 'thai', 'photos', 'generated.json');
const IMG = path.join(ROOT, 'public', 'thai', 'img');
const MANIFEST = path.join(IMG, 'manifest.json');
const SHOTS = path.join(ROOT, 'shots');
const SIZE = 480;

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('--')) || 'help';
const only = (args.find((a) => a.startsWith('--chapter=')) || '').slice(10);
const force = args.includes('--force');

const exists = (p) => access(p).then(() => true, () => false);
const readJson = async (p, fallback) => ((await exists(p)) ? JSON.parse(await readFile(p, 'utf8')) : fallback);

async function fetchRetry(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      if (attempt >= 3) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= 3) throw new Error(`${err.message} downloading ${url}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
}

async function importPictures() {
  const generated = await readJson(GENERATED, {});
  const manifest = await readJson(MANIFEST, { photos: {} });
  await mkdir(IMG, { recursive: true });
  const words = allWords().filter((w) => !w.swatch && w.n == null && (!only || w.chapter === only));

  const todo = words.filter((w) => {
    const g = generated[w.id];
    if (!g?.url) return false;
    const prev = manifest.photos[w.id];
    return force || !prev || prev.job !== g.job;
  });
  console.log(`\n  ${todo.length} pictures to import`);

  let done = 0;
  const queue = [...todo];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const w = queue.shift();
      const g = generated[w.id];
      const webp = await sharp(await fetchRetry(g.url))
        .resize(SIZE, SIZE, { fit: 'cover' })
        .webp({ quality: 78 })
        .toBuffer();
      const hash = createHash('sha1').update(webp).digest('hex').slice(0, 8);
      const file = `${w.id.replace(/[^a-z0-9]+/g, '-')}-${hash}.webp`;
      await writeFile(path.join(IMG, file), webp);
      manifest.photos[w.id] = { file, source: 'higgsfield', model: 'gpt_image_2_5', job: g.job };
      done++;
      process.stdout.write(`\r  imported ${done}/${todo.length}`);
    }
  }));
  if (done) process.stdout.write('\n');

  // Forget pictures for words that no longer exist and delete unused files.
  const ids = new Set(allWords().map((w) => w.id));
  for (const id of Object.keys(manifest.photos)) if (!ids.has(id)) delete manifest.photos[id];
  const used = new Set(Object.values(manifest.photos).map((p) => p.file));
  for (const f of await readdir(IMG)) if (f.endsWith('.webp') && !used.has(f)) await unlink(path.join(IMG, f));

  const sorted = Object.fromEntries(Object.entries(manifest.photos).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify({ photos: sorted }, null, 1) + '\n');
  const missing = allWords().filter((w) => !w.swatch && w.n == null && !sorted[w.id]).map((w) => w.id);
  if (missing.length) console.log(`  still without a picture: ${missing.join(', ')}`);
  console.log(`  ✓ ${Object.keys(sorted).length} pictures in public/thai/img/\n`);
}

/** One PNG per chapter showing every picture with its word, for checking by eye. */
async function sheets() {
  const manifest = await readJson(MANIFEST, { photos: {} });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await mkdir(SHOTS, { recursive: true });
  for (const chapter of CHAPTERS) {
    if (only && chapter.id !== only) continue;
    const words = allWords().filter((w) => w.chapter === chapter.id && manifest.photos[w.id]);
    if (!words.length) continue;
    const cells = words.map((w) => {
      const src = pathToFileURL(path.join(IMG, manifest.photos[w.id].file)).href;
      return `<figure><img src="${src}"><figcaption>${w.en}</figcaption></figure>`;
    }).join('');
    await page.setContent(`<style>
      body{margin:10px;font:600 15px system-ui;background:#fff}
      h1{font-size:18px;margin:0 0 8px}
      .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
      figure{margin:0} img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
      figcaption{text-align:center;padding:3px 0}
    </style><h1>${chapter.title}</h1><div class="grid">${cells}</div>`, { waitUntil: 'load' });
    const file = path.join(SHOTS, `pictures-${chapter.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  📸 ${path.relative(ROOT, file)}`);
  }
  await browser.close();
}

const commands = { import: importPictures, sheets };
if (!commands[command]) {
  console.log('\n  npm run thai:pictures -- import | sheets   (see the top of scripts/thai-pictures.mjs)\n');
  process.exit(command === 'help' ? 0 : 1);
}
commands[command]().catch((err) => { console.error(`\n  ✗ ${err.message}\n`); process.exit(1); });
