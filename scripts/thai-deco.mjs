#!/usr/bin/env node
/**
 * Copies the decoration images (mascot, icons, stickers) listed in
 * src/thai/data/deco.js out of @lobehub/fluent-emoji-3d into
 * public/thai/deco/, and makes the home-screen icons. Only the handful
 * actually used are copied, so the package itself never ships.
 *
 *   npm run thai:deco
 */

import { copyFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { ICONS, CHAPTER_ICONS, STICKERS, SHINY_STICKERS, codepoints, decoFile } from '../src/thai/data/deco.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'thai', 'deco');
const PKG = path.join(path.dirname(require.resolve('@lobehub/fluent-emoji-3d/package.json')), 'assets');

const exists = (p) => access(p).then(() => true, () => false);

/** The package sometimes keeps or drops the FE0F variation selector. */
async function source(emoji) {
  const cp = codepoints(emoji);
  for (const name of [cp, cp.replace(/-fe0f/g, ''), `${cp}-fe0f`]) {
    const p = path.join(PKG, `${name}.webp`);
    if (await exists(p)) return p;
  }
  return null;
}

await mkdir(OUT, { recursive: true });
const all = [...Object.values(ICONS), ...Object.values(CHAPTER_ICONS), ...STICKERS.map((s) => s[1]), ...SHINY_STICKERS.map((s) => s[1])];
const missing = [];
for (const emoji of new Set(all)) {
  const src = await source(emoji);
  if (!src) { missing.push(emoji); continue; }
  await copyFile(src, path.join(OUT, decoFile(emoji)));
}
if (missing.length) {
  console.error(`  ✗ not in the emoji pack: ${missing.join(' ')}`);
  process.exit(1);
}

// Home-screen icons: the mascot on the app's cream background.
const mascot = await source(ICONS.mascot);
for (const size of [180, 192, 512]) {
  const inner = Math.round(size * 0.72);
  const art = await sharp(mascot).resize(inner, inner).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#fff6ea' } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, `icon-${size}.png`));
}

console.log(`  ✓ ${new Set(all).size} decoration images + 3 app icons in public/thai/deco/`);
