#!/usr/bin/env node
/**
 * Headless smoke test: boots the built game in Chromium, walks through the
 * things Sofia would actually do, and writes screenshots to shots/.
 *
 *   npm run build && node scripts/smoke-test.mjs
 *
 * It fails loudly on any console error or page exception, so a broken build
 * can't be mistaken for a working one.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const SHOTS = path.join(__dirname, '..', 'shots');
const PORT = 4319;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.map': 'application/json', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

function serve() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url === '/' ? 'index.html' : url);
    if (!existsSync(file)) file = path.join(DIST, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const problems = [];

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log(`  📸 ${name}`);
}

async function waitForFrames(page, count = 6) {
  await page.evaluate((n) => new Promise((resolve) => {
    let i = 0;
    const tick = () => (++i >= n ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }), count);
}

/**
 * Read a number out of the running game.
 *
 * Deliberately strict: a probe that comes back undefined means the hook is
 * missing or misnamed, and every `x < y` check downstream would quietly pass.
 */
async function probeNumber(page, label, fn) {
  const value = await page.evaluate(fn);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    problems.push(`probe "${label}" returned ${JSON.stringify(value)}, expected a number`);
    return NaN;
  }
  return value;
}

async function main() {
  if (!existsSync(DIST)) {
    console.error('  ✗ No dist/ — run `npm run build` first.');
    process.exit(1);
  }
  await mkdir(SHOTS, { recursive: true });
  const server = await serve();

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // This runs on software GL, where a 2048² shadow map costs seconds a frame.
  // Turn shadows off up front so the test finishes in a sane amount of time.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sofias-village-save', JSON.stringify({
        version: 1, characters: [], activeCharacterId: null, edits: {}, location: null,
        discovered: {}, settings: { voice: false, firstPerson: false, shadows: false },
        playedBefore: false,
      }));
    } catch { /* storage blocked; the test still runs, just slower */ }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

  console.log('\n  Booting…');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('#title:not([hidden])', { timeout: 45000 });
  await waitForFrames(page, 8);
  await shot(page, '01-title');

  // --- Structural checks over every zone ---
  console.log('  Checking the world holds together…');
  const worldProblems = await page.evaluate(() => window.__game.validateWorld());
  for (const problem of worldProblems) console.log(`    ✗ ${problem}`);
  if (worldProblems.length) problems.push(...worldProblems.map((p) => `world: ${p}`));
  else console.log('    all zones, doors and spawns line up');

  // --- Village ---
  console.log('  Village…');
  await page.click('#title .btn');
  await waitForFrames(page, 10);
  const zoneName = await page.textContent('#zone-name');
  console.log(`    zone: ${zoneName}`);
  await shot(page, '02-village');

  // Walk forward toward the cottage door.
  console.log('  Walking to the cottage…');
  await page.keyboard.down('KeyW');
  for (let i = 0; i < 25; i++) await waitForFrames(page, 4);
  await page.keyboard.up('KeyW');
  await waitForFrames(page, 8);
  const inside = await page.textContent('#zone-name');
  console.log(`    zone: ${inside}`);
  await shot(page, '03-walked');

  // --- Force our way into the cottage interior and build ---
  console.log('  Cottage interior + building…');
  await page.evaluate(() => window.__game.enterZone('cottage_in'));
  await waitForFrames(page, 8);
  await shot(page, '04-cottage-interior');

  const before = await probeNumber(page, 'blockCount', () => window.__game.blockCount());

  // Park the cursor before aiming. Moving the mouse is itself a look input —
  // the game applies it, correctly — so aiming first and moving second left the
  // camera pointing at open air by the time the click landed.
  await page.mouse.move(640, 400);
  // Steeply down at the floor just ahead, and re-aimed before every click so a
  // stray pixel of drift can't send the ray off into nothing.
  const aimAtFloor = async () => {
    await page.evaluate(() => window.__game.setLook(0, 0.85));
    await waitForFrames(page, 2);
  };

  await aimAtFloor();
  for (let i = 0; i < 5; i++) {
    await page.mouse.down({ button: 'right' });
    await page.mouse.up({ button: 'right' });
    await waitForFrames(page, 3);
    await aimAtFloor();
  }
  const after = await probeNumber(page, 'blockCount', () => window.__game.blockCount());
  console.log(`    blocks: ${before} → ${after}`);
  if (!(after > before)) {
    problems.push(`placing blocks did not raise the block count (${before} → ${after})`);
  }
  await shot(page, '05-built-blocks');

  // Remove one back off.
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await waitForFrames(page, 6);
  const afterBreak = await probeNumber(page, 'blockCount', () => window.__game.blockCount());
  console.log(`    after removing: ${afterBreak}`);
  if (!(afterBreak < after)) {
    problems.push(`removing a block did not lower the block count (${after} → ${afterBreak})`);
  }

  // --- Talking ---
  console.log('  Talking to a villager…');
  await page.evaluate(() => window.__game.goToNearestNpc());
  await waitForFrames(page, 6);
  await page.keyboard.press('KeyE');
  await waitForFrames(page, 10);
  const dialogueVisible = await page.evaluate(
    () => document.getElementById('dialogue').classList.contains('show'),
  );
  const said = await page.textContent('#dialogue .text');
  console.log(`    dialogue: ${dialogueVisible ? `"${said}"` : 'NOT SHOWN'}`);
  if (!dialogueVisible) problems.push('dialogue did not appear after pressing E next to a villager');
  await shot(page, '06-dialogue');

  // --- Character creator ---
  console.log('  Character creator…');
  await page.keyboard.press('Escape');
  await waitForFrames(page, 6);
  await page.click('#pause .btn.lilac');
  await waitForFrames(page, 8);
  await shot(page, '07-character-creator');
  const chipCount = await page.evaluate(() => document.querySelectorAll('#creator .chip').length);
  if (chipCount < 10) problems.push(`character creator only rendered ${chipCount} options`);

  // Make a new character and switch to them. Buttons are found by their label
  // rather than by class — several share `.btn.secondary`, including the per-row
  // Edit buttons, and picking the wrong one silently edits the existing
  // character instead of creating a new one.
  const clickByText = (label) => page.evaluate((text) => {
    const button = [...document.querySelectorAll('#creator button')]
      .find((b) => b.textContent.trim() === text);
    if (!button) throw new Error(`no button labelled "${text}"`);
    button.click();
  }, label);

  await clickByText('+ New character');
  await waitForFrames(page, 6);
  await page.fill('#creator input[type="text"]', 'Star');
  await clickByText('🎲 Surprise me');
  await waitForFrames(page, 8);
  const editingBeforeSave = await page.evaluate(() => window.__game && document
    .querySelector('#creator h2').textContent);
  if (editingBeforeSave !== 'Make a character') {
    problems.push(`expected to be making a new character, header said "${editingBeforeSave}"`);
  }
  await clickByText('Save');
  await waitForFrames(page, 8);
  const charCount = await probeNumber(page, 'characterCount', () => window.__game.characterCount());
  console.log(`    characters: ${charCount}`);
  if (!(charCount >= 2)) problems.push(`saving a new character did not add one (${charCount})`);

  // Switching who you're playing as is half of what the creator is for.
  await clickByText('Play as');
  await waitForFrames(page, 10);
  const playingAs = await page.evaluate(() => window.__game.activeCharacterName());
  console.log(`    playing as: ${playingAs}`);
  if (playingAs !== 'Star') problems.push(`switching character failed (playing as ${playingAs})`);
  await shot(page, '08-two-characters');

  await clickByText('Done');
  await waitForFrames(page, 10);

  // --- Other interiors ---
  for (const zone of ['modern_in', 'bakery_in', 'barn_in', 'library_in']) {
    console.log(`  ${zone}…`);
    await page.evaluate((z) => window.__game.enterZone(z), zone);
    await waitForFrames(page, 8);
    await shot(page, `09-${zone}`);
  }

  // --- Moon house ---
  console.log('  Moon house…');
  await page.evaluate(() => window.__game.enterZone('moon_house'));
  await waitForFrames(page, 10);
  await shot(page, '10-moon-house');
  // Stand at the back of the viewing island, looking up at the whole crescent.
  await page.evaluate(() => window.__game.placeAt([21.5, 2, 59.5], 0, -0.36));
  await waitForFrames(page, 10);
  await shot(page, '11-moon-house-front');

  // --- Persistence ---
  console.log('  Save + reload…');
  await page.evaluate(() => window.__game.saveNow());
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#title:not([hidden])', { timeout: 45000 });
  // The hook only exists once boot() has finished; without this wait every
  // probe below returns undefined and the comparisons pass without testing.
  await page.waitForFunction(() => !!window.__game, null, { timeout: 45000 });
  await waitForFrames(page, 8);
  const restored = await probeNumber(page, 'characterCount', () => window.__game.characterCount());
  const restoredZone = await page.evaluate(() => window.__game.zoneId());
  const restoredEdits = await probeNumber(page, 'editCount', () => window.__game.editCount());
  console.log(`    after reload — characters: ${restored}, zone: ${restoredZone}, edits: ${restoredEdits}`);
  if (!(restored >= 2)) problems.push(`characters not persisted across reload (got ${restored})`);
  if (!(restoredEdits >= 1)) problems.push(`block edits not persisted across reload (got ${restoredEdits})`);
  if (restoredZone !== 'moon_house') {
    problems.push(`did not resume in the last zone (got ${restoredZone})`);
  }
  await shot(page, '12-after-reload');

  // --- Touch layout ---
  console.log('  Phone layout…');
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      + ' (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  phone.on('pageerror', (error) => problems.push(`phone pageerror: ${error.message}`));
  await phone.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await phone.waitForSelector('#title:not([hidden])', { timeout: 45000 });
  await phone.screenshot({ path: path.join(SHOTS, '13-phone-title.png') });
  await phone.click('#title .btn');
  await waitForFrames(phone, 30);
  await phone.evaluate(() => window.__game.enterZone('cottage_in'));
  await waitForFrames(phone, 25);
  await phone.screenshot({ path: path.join(SHOTS, '14-phone-play.png') });
  const touchVisible = await phone.evaluate(
    () => !document.getElementById('touch').hasAttribute('hidden'),
  );
  console.log(`    touch controls visible: ${touchVisible}`);
  if (!touchVisible) problems.push('touch controls are hidden on a touch device');
  console.log('  📸 13-phone-title, 14-phone-play');

  await browser.close();
  server.close();

  if (problems.length) {
    console.error(`\n  ✗ ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`      • ${problem}`);
    process.exit(1);
  }
  console.log('\n  ✓ All good.\n');
}

main().catch((error) => {
  console.error('\n  ✗ Smoke test crashed:', error);
  process.exit(1);
});
