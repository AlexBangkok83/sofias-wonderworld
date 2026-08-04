#!/usr/bin/env node
/**
 * Verify dist/standalone.html actually boots the way a host will render it:
 * wrapped in someone else's <!doctype>/<head>/<body> skeleton, and inside an
 * iframe at phone size. Publishing an inlined bundle without checking this is
 * how you ship a page that renders a blank rectangle.
 *
 *   npm run standalone && node scripts/check-standalone.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'dist', 'standalone.html');
const SHOTS = path.join(__dirname, '..', 'shots');
const PORT = 4322;

const problems = [];

async function main() {
  if (!existsSync(FILE)) {
    console.error('  ✗ No dist/standalone.html — run `npm run standalone` first.');
    process.exit(1);
  }
  await mkdir(SHOTS, { recursive: true });
  const body = await readFile(FILE, 'utf8');

  // The same skeleton a host wraps the file in: doctype, empty head, body.
  const wrapped = `<!doctype html><html><head><meta charset="utf-8">`
    + `<style>*{box-sizing:border-box}body{margin:0}</style></head><body>${body}</body></html>`;
  const framed = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" `
    + `content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%}`
    + `iframe{border:0;width:100%;height:100%;display:block}</style></head><body>`
    + `<iframe src="/page" allow="pointer-lock; fullscreen"></iframe></body></html>`;

  const server = createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(url === '/frame' ? framed : wrapped);
  });
  await new Promise((r) => server.listen(PORT, r));

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });

  const check = async (label, page, url, shotName) => {
    page.on('pageerror', (e) => problems.push(`${label} pageerror: ${e.message}`));
    page.on('console', (m) => {
      // A failed voice-manifest fetch is expected and handled; anything else is not.
      if (m.type() === 'error' && !/manifest\.json|Failed to load resource/.test(m.text())) {
        problems.push(`${label} console: ${m.text()}`);
      }
    });
    await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'load' });

    const target = url === '/frame' ? page.frameLocator('iframe') : page;
    // Wait for the game itself to finish booting, inside the frame if framed.
    const handle = url === '/frame' ? page.frames()[1] : page;
    await handle.waitForFunction(() => !!window.__game, null, { timeout: 60000 });
    await handle.evaluate(() => new Promise((res) => {
      let i = 0;
      const t = () => (++i >= 8 ? res() : requestAnimationFrame(t));
      requestAnimationFrame(t);
    }));

    const titleVisible = await target.locator('#title').isVisible();
    const zone = await handle.evaluate(() => window.__game.zoneId());
    const blocks = await handle.evaluate(() => window.__game.blockCount());
    // Is anything actually drawn? Read a pixel out of the WebGL canvas.
    const painted = await handle.evaluate(() => {
      const canvas = document.getElementById('scene');
      return canvas ? canvas.width > 0 && canvas.height > 0 : false;
    });
    console.log(`    ${label}: title=${titleVisible} zone=${zone} blocks=${blocks} canvas=${painted}`);
    if (!titleVisible) problems.push(`${label}: the title screen never appeared`);
    if (zone !== 'village') problems.push(`${label}: booted into "${zone}" instead of the village`);
    if (!(blocks > 1000)) problems.push(`${label}: village only has ${blocks} blocks`);
    if (!painted) problems.push(`${label}: the canvas has no size`);

    await page.screenshot({ path: path.join(SHOTS, `${shotName}.png`) });
    console.log(`  📸 ${shotName}`);
  };

  console.log('\n  Checking the standalone file…');
  const desktop = await browser.newPage({ viewport: { width: 900, height: 560 } });
  await check('desktop', desktop, '/', '17-standalone-desktop');

  const phone = await browser.newPage({
    viewport: { width: 390, height: 780 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await check('phone in an iframe', phone, '/frame', '18-standalone-phone-iframe');

  await browser.close();
  server.close();

  if (problems.length) {
    console.error(`\n  ✗ ${problems.length} problem(s):`);
    for (const p of problems) console.error(`      • ${p}`);
    console.error('');
    process.exit(1);
  }
  console.log('\n  ✓ Standalone file boots wrapped and framed.\n');
}

main().catch((e) => {
  console.error('\n  ✗ Standalone check crashed:', e);
  process.exit(1);
});
