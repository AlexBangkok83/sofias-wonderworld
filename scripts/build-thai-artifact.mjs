#!/usr/bin/env node
/**
 * Packs Learn Thai into a single page plus a few data scripts, so it can be
 * opened as a private claude.ai page (or any host that takes one HTML file
 * and some scripts) without a server.
 *
 *   npm run build && npm run thai:artifact
 *
 * Output in dist/thai-artifact/:
 *   index.html     the page: styles and fonts inline, a loading screen, a tiny loader
 *   app.js         the app itself
 *   files-N.js     every picture and voice clip as data: URLs, about 6 MB each
 *
 * The app finds embedded files through window.__THAI_FILES (src/thai/core/assets.js).
 * Talking with Khru Mali is switched off in this copy: it needs the token server.
 */

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const THAI = path.join(DIST, 'thai');
const OUT = path.join(DIST, 'thai-artifact');
const CHUNK = 6 * 1024 * 1024;
const MIME = { '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };

const stripSourcemap = (code) => code.replace(/^\s*\/\/#\s*sourceMappingURL=.*$/gm, '');

async function main() {
  const html = await readFile(path.join(THAI, 'index.html'), 'utf8').catch(() => null);
  if (!html) throw new Error('No dist/thai/index.html: run `npm run build` first.');
  const jsName = html.match(/src="\.\.\/assets\/(thai-[^"]+\.js)"/)?.[1];
  const cssName = html.match(/href="\.\.\/assets\/(thai-[^"]+\.css)"/)?.[1];
  if (!jsName || !cssName) throw new Error('Could not find the Learn Thai script and styles in dist/thai/index.html.');

  // Styles with the fonts inlined (woff2 only: every browser that runs the app reads it).
  let css = await readFile(path.join(DIST, 'assets', cssName), 'utf8');
  css = css.replace(/,\s*url\([^)]*\.woff\)\s*format\(["']?woff["']?\)/g, '');
  const fonts = [...new Set([...css.matchAll(/url\(\.?\/?([^)]+\.woff2)\)/g)].map((m) => m[1]))];
  for (const f of fonts) {
    const data = (await readFile(path.join(DIST, 'assets', path.basename(f)))).toString('base64');
    css = css.split(`url(./${f})`).join(`url(data:font/woff2;base64,${data})`).split(`url(${f})`).join(`url(data:font/woff2;base64,${data})`);
  }

  // Every file the app loads by path, as data: URLs (JSON stays text).
  const entries = [];
  for (const dir of ['audio', 'img', 'deco']) {
    for (const f of (await readdir(path.join(THAI, dir))).sort()) {
      const ext = path.extname(f);
      const key = `${dir}/${f}`;
      const buf = await readFile(path.join(THAI, dir, f));
      if (ext === '.json') entries.push([key, buf.toString('utf8')]);
      else if (MIME[ext]) entries.push([key, `data:${MIME[ext]};base64,${buf.toString('base64')}`]);
    }
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const chunks = [];
  let current = {};
  let size = 0;
  for (const [key, value] of entries) {
    if (size + value.length > CHUNK && size > 0) { chunks.push(current); current = {}; size = 0; }
    current[key] = value;
    size += value.length;
  }
  chunks.push(current);
  const names = [];
  for (const [i, chunk] of chunks.entries()) {
    const name = `files-${i + 1}.js`;
    names.push(name);
    await writeFile(path.join(OUT, name), `Object.assign(window.__THAI_FILES = window.__THAI_FILES || {}, ${JSON.stringify(chunk)});\n`);
  }

  await writeFile(path.join(OUT, 'app.js'), stripSourcemap(await readFile(path.join(DIST, 'assets', jsName), 'utf8')));

  // Body-only page: the host supplies <html>, <head> and the viewport.
  const page = `<title>Learn Thai</title>
<style>
${css}
.boot { min-height: 80vh; display: grid; place-content: center; gap: 10px; text-align: center; font: 700 1.1rem system-ui, sans-serif; color: #2b2238; }
.boot small { font-weight: 600; color: #6b5f7a; }
</style>
<div id="app">
  <div class="boot">
    <div>Loading Learn Thai…</div>
    <small id="boot-progress">Pictures and voice: 0%</small>
  </div>
</div>
<script>
(function () {
  var files = ${JSON.stringify(names)};
  var loaded = 0;
  var label = document.getElementById('boot-progress');
  files.forEach(function (name) {
    var s = document.createElement('script');
    s.src = name;
    s.onload = function () {
      loaded++;
      label.textContent = 'Pictures and voice: ' + Math.round((loaded / files.length) * 100) + '%';
      if (loaded === files.length) {
        var app = document.createElement('script');
        app.type = 'module';
        app.src = 'app.js';
        document.body.appendChild(app);
      }
    };
    s.onerror = function () { label.textContent = 'Could not load ' + name + '. Check the connection and reload.'; };
    document.body.appendChild(s);
  });
})();
</script>
`;
  await writeFile(path.join(OUT, 'index.html'), page);

  const total = entries.reduce((n, [, v]) => n + v.length, 0);
  console.log(`\n  ✓ dist/thai-artifact/: index.html (${Math.round(page.length / 1024)} KB), app.js, ${names.length} data files (${(total / 1048576).toFixed(1)} MB, ${entries.length} files embedded)\n`);
}

main().catch((err) => { console.error(`\n  ✗ ${err.message}\n`); process.exit(1); });
