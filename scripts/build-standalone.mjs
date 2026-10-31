#!/usr/bin/env node
/**
 * Fold the production build into one self-contained HTML file.
 *
 *   npm run build && npm run standalone
 *
 * Everything is inlined — script, styles, the empty voice manifest — so the
 * page needs no other files and no network at all. That makes it publishable
 * anywhere that takes a single HTML file, including as a private Claude
 * artifact, which is the quickest way to get the game onto a phone without
 * setting up hosting.
 *
 * Output: dist/standalone.html
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(DIST, 'standalone.html');

/** Strip the //# sourceMappingURL comment — the .map isn't coming along. */
function stripSourcemap(code) {
  return code.replace(/^\s*\/\/#\s*sourceMappingURL=.*$/gm, '');
}

/** `</script` anywhere in the bundle would close the tag early. */
function escapeForScriptTag(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

async function main() {
  const assets = await readdir(path.join(DIST, 'assets'));
  const jsName = assets.find((f) => f.endsWith('.js'));
  const cssName = assets.find((f) => f.endsWith('.css'));
  if (!jsName || !cssName) throw new Error('No built assets — run `npm run build` first.');

  const js = stripSourcemap(await readFile(path.join(DIST, 'assets', jsName), 'utf8'));
  const css = await readFile(path.join(DIST, 'assets', cssName), 'utf8');

  // Body-only document: no <html>, <head> or <body> tags, so it can be dropped
  // straight into a host page that supplies its own skeleton.
  const html = `<title>Sofia's Village</title>
<style>
${css}
</style>
<div id="app"></div>
<script type="module">
// Some hosts render this inside a frame and supply their own <head>. Set the
// viewport ourselves so a phone lays the game out at device width rather than
// at a desktop width scaled down to illegibility.
(() => {
  const existing = document.querySelector('meta[name="viewport"]');
  const content = 'width=device-width, initial-scale=1, maximum-scale=1,'
    + ' user-scalable=no, viewport-fit=cover';
  if (existing) {
    existing.setAttribute('content', content);
  } else {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = content;
    document.head.appendChild(meta);
  }
  // The host's own page styles may not expect a full-screen game.
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
})();

${escapeForScriptTag(js)}
</script>
`;

  await writeFile(OUT, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log(`\n  ✓ ${path.relative(process.cwd(), OUT)} — ${kb} KB, no external files.\n`);
}

main().catch((error) => {
  console.error(`\n  ✗ ${error.message}\n`);
  process.exit(1);
});
