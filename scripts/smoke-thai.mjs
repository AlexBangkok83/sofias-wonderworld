#!/usr/bin/env node
/**
 * Headless playthrough of Learn Thai at phone size: every game, the points
 * going up and (a little) down, a chapter unlocking, swapping points for
 * Robux, Today's Lesson, practice, and a reload to check it all saved.
 * Screenshots land in shots/thai-*.png. Fails on any console error.
 *
 *   npm run build && node scripts/smoke-thai.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const SHOTS = path.join(__dirname, '..', 'shots');
const PORT = 4331;
const URL = `http://localhost:${PORT}/thai/?test`;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.webp': 'image/webp',
  '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json',
};

function serve() {
  const server = createServer(async (req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (url.endsWith('/')) url += 'index.html';
    const file = path.join(DIST, url);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const problems = [];
const check = (ok, what) => {
  console.log(`  ${ok ? '✓' : '✗'} ${what}`);
  if (!ok) problems.push(what);
};

async function main() {
  if (!existsSync(path.join(DIST, 'thai', 'index.html'))) {
    console.error('  ✗ No dist/thai/index.html: run `npm run build` first.');
    process.exit(1);
  }
  await mkdir(SHOTS, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  page.on('console', (m) => {
    // 404s are reported with their URL by the response handler below.
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problems.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOTS, `thai-${name}.png`) });
    console.log(`  📸 thai-${name}`);
  };
  const wallet = () => page.evaluate(() => JSON.parse(localStorage.getItem('learn-thai:v1') || '{}').wallet || 0);
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('learn-thai:v1') || '{}'));
  const answer = () => page.evaluate(() => window.__thai.answer);
  const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(250); };
  const waitResults = async () => page.waitForSelector('.results-screen', { timeout: 30000 });
  const noSideScroll = async (where) => {
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check(ok, `no sideways scrolling on ${where}`);
  };

  // ── Home ──
  await page.goto(URL);
  await page.waitForSelector('.home-screen .node');
  check(await page.locator('.node').count() === 29, 'home shows all 29 chapters');
  check(await page.locator('.node.locked').count() === 28, 'only chapter 1 is open at the start');
  await shot('01-home');
  await noSideScroll('home');

  // ── Chapter 1 ──
  await page.locator('.node').first().click();
  await page.waitForSelector('.chapter-screen');
  check(await page.locator('.word-mini').count() === 12, 'chapter 1 lists its 12 words');
  await shot('02-chapter');

  // ── Learn ──
  const before = await wallet();
  await page.locator('.big-action.learn').click();
  await page.waitForSelector('.learn-card');
  for (let i = 0; i < 12; i++) {
    if (i === 7) await shot('03-learn-card');
    await page.locator('.next-btn').click();
    await page.waitForTimeout(60);
  }
  await waitResults();
  const learnGain = (await wallet()) - before;
  check(learnGain === 12 * 2 + 10, `Learn pays 2 per new card + 10 for finishing (got ${learnGain})`);
  check((await saved()).chapters.hello.learned, 'chapter marked learned');
  await shot('04-learn-results');

  // ── Memory: one deliberate mismatch, then every pair ──
  await go('#/play/hello/memory');
  await page.waitForSelector('.mcard');
  const ids = await page.locator('.mcard').evaluateAll((els) => els.map((e) => e.dataset.testId));
  const words = [...new Set(ids.map((t) => t.split('|')[0]))];
  check(words.length === 6, 'memory deals 6 pairs');
  await page.locator(`[data-test-id="${words[0]}|word"]`).click();
  await page.locator(`[data-test-id="${words[1]}|pic"]`).click();
  await page.waitForTimeout(1400);
  check(await page.locator('.mcard.flipped').count() === 0, 'mismatched cards flip back');
  for (const [k, w] of words.entries()) {
    await page.locator(`[data-test-id="${w}|word"]`).click();
    await page.locator(`[data-test-id="${w}|pic"]`).click();
    await page.waitForTimeout(650);
    if (k === 2) await shot('05-memory');
  }
  await waitResults();
  check(await page.locator('.mcard.matched').count() === 0, 'memory finished to results');
  await shot('06-memory-results');

  // ── Listen & Find: one wrong tap costs points, then all right ──
  await go('#/play/hello/listen');
  await page.waitForSelector('.choice');
  let first = true;
  for (let r = 0; r < 8; r++) {
    await page.waitForFunction(() => document.querySelectorAll('.choice:not(.correct)').length >= 3 && !document.querySelector('.choice.correct'));
    const target = await answer();
    if (first) {
      const w0 = await wallet();
      await page.locator(`.choice:not([data-test-id="${target}"])`).first().click();
      await page.waitForTimeout(150);
      check((await wallet()) === w0 - 2, 'a wrong answer takes 2 points');
      await shot('07-listen-wrong');
      first = false;
    }
    await page.locator(`.choice[data-test-id="${target}"]`).click();
    if (r === 0) { await page.waitForTimeout(250); await shot('08-listen-right'); }
    await page.waitForFunction((t) => window.__thai.answer !== t || document.querySelector('.results-screen'), target, { timeout: 15000 });
  }
  await waitResults();
  await shot('09-results');

  // ── Chapter 2 should now be open (learned + 2 games = 2 stars) ──
  await go('#/');
  await page.waitForSelector('.home-screen');
  check(!(await page.locator('.node').nth(1).getAttribute('class')).includes('locked'), 'chapter 2 unlocked after 2 stars');

  // ── Bubble Pop ──
  await go('#/play/hello/bubbles');
  await page.waitForSelector('.bubble');
  for (let r = 0; r < 8; r++) {
    const target = await answer();
    const bubble = page.locator(`.bubble[data-test-id="${target}"]`).first();
    await bubble.waitFor({ state: 'attached', timeout: 10000 });
    if (r === 1) await shot('10-bubbles');
    await bubble.dispatchEvent('pointerdown');
    await page.waitForFunction((t) => window.__thai.answer !== t || document.querySelector('.results-screen'), target, { timeout: 15000 });
  }
  await waitResults();

  // ── Read It ──
  await go('#/play/hello/read');
  for (let r = 0; r < 8; r++) {
    await page.waitForFunction(() => document.querySelectorAll('.answer').length === 3 && !document.querySelector('.answer.correct'));
    const target = await answer();
    if (r === 0) await shot('11-read');
    await page.locator(`.answer[data-test-id="${target}"]`).click();
    await page.waitForFunction((t) => window.__thai.answer !== t || document.querySelector('.results-screen'), target, { timeout: 15000 });
  }
  await waitResults();

  // ── ใช่ or ไม่ใช่ ──
  await go('#/play/hello/yesno');
  for (let r = 0; r < 10; r++) {
    await page.waitForFunction(() => !document.querySelector('.yn-btn.correct, .yn-btn.wrong'));
    const yes = (await answer()) === 'yes';
    if (r === 0) await shot('12-yesno');
    await page.locator(yes ? '.yn-btn.yes' : '.yn-btn.no').click();
    await page.waitForFunction(() => document.querySelector('.yn-btn.correct') || document.querySelector('.results-screen'));
    await page.waitForFunction(() => !document.querySelector('.yn-btn.correct') || document.querySelector('.results-screen'), null, { timeout: 15000 });
  }
  await waitResults();

  // ── Grown-ups: set a PIN and a swap rate ──
  await go('#/parents');
  await page.waitForSelector('.pin-key');
  const typePin = async (pin) => {
    for (const d of pin) { await page.locator('.pin-key', { hasText: new RegExp(`^${d}$`) }).click(); await page.waitForTimeout(40); }
  };
  await typePin('1234');
  await page.waitForSelector('h1:has-text("Type the PIN again")');
  await typePin('1234');
  await page.waitForSelector('.panel');
  const rate = page.locator('.rate-row input[type=number]');
  await rate.nth(0).fill('100'); await rate.nth(0).dispatchEvent('change');
  await rate.nth(1).fill('10'); await rate.nth(1).dispatchEvent('change');
  await shot('13-parents');

  // ── Swap 100 points for 10 Robux, approve it ──
  await go('#/swap');
  await page.waitForSelector('.swap-btn');
  await shot('14-swap');
  const w1 = await wallet();
  await page.locator('.swap-btn').first().click();
  await page.waitForTimeout(300);
  check((await wallet()) === w1 - 100, 'asking to swap sets 100 points aside');
  await go('#/parents');
  await page.waitForSelector('.request-list li');
  await page.locator('.request-list .btn.primary').click();
  await page.waitForTimeout(300);
  check((await saved()).swaps[0].status === 'done', 'grown-up approves the swap');

  // ── Today's Lesson ──
  await go('#/lesson');
  await page.waitForSelector('.learn-card');
  for (let i = 0; i < 4; i++) { await page.locator('.next-btn').click(); await page.waitForTimeout(60); }
  await page.waitForSelector('.choice');
  for (let r = 0; r < 8; r++) {
    await page.waitForFunction(() => document.querySelectorAll('.choice').length >= 3 && !document.querySelector('.choice.correct'));
    const target = await answer();
    await page.locator(`.choice[data-test-id="${target}"]`).click();
    await page.waitForFunction(() => !document.querySelector('.choice.correct') || document.querySelector('.results-screen'), null, { timeout: 15000 });
  }
  await waitResults();
  check(await page.locator('.result-card h1', { hasText: 'Lesson complete' }).count() === 1, "Today's Lesson completes");
  await shot('15-lesson-done');

  // ── Stickers ──
  await go('#/stickers');
  await page.waitForSelector('.sticker');
  check(await page.locator('.sticker.got').count() >= 1, 'at least one sticker earned');
  await shot('16-stickers');

  // ── Reload: everything saved ──
  const keep = await saved();
  await page.reload();
  await page.waitForSelector('.status-bar');
  const after = await saved();
  check(after.wallet === keep.wallet && after.lifetime === keep.lifetime, 'points survive a reload');
  check(after.stickers.length === keep.stickers.length, 'stickers survive a reload');

  // ── Home again, scrolled ──
  await go('#/');
  await page.waitForSelector('.home-screen');
  await page.waitForTimeout(300);
  await shot('17-home-after');
  await noSideScroll('home after playing');

  await browser.close();
  server.close();

  if (problems.length) {
    console.error(`\n  ✗ ${problems.length} problem(s):\n${problems.map((p) => `    - ${p}`).join('\n')}\n`);
    process.exit(1);
  }
  console.log('\n  ✓ Learn Thai smoke test passed\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
