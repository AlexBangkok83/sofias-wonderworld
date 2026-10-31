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

async function waitForFrames(page, count = 3) {
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
  // Modest viewport on purpose: this usually runs on software GL, where cost
  // scales with pixels and a full-size window turns a 5 minute run into 25.
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });

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
  await waitForFrames(page, 4);
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
  await waitForFrames(page, 5);
  const zoneName = await page.textContent('#zone-name');
  console.log(`    zone: ${zoneName}`);
  await shot(page, '02-village');

  // Walk forward toward the cottage door, stopping as soon as we're inside.
  console.log('  Walking to the cottage…');
  await page.keyboard.down('KeyW');
  let inside = null;
  for (let i = 0; i < 45; i++) {
    await waitForFrames(page, 3);
    inside = await page.evaluate(() => window.__game.zoneId());
    if (inside === 'cottage_in') break;
  }
  await page.keyboard.up('KeyW');
  await waitForFrames(page, 4);
  console.log(`    zone: ${inside}`);
  // Walking into a door is the whole way you get indoors — there's no prompt
  // and no button, so if this stops working the village becomes scenery.
  if (inside !== 'cottage_in') {
    problems.push(`walking into the cottage door did not go inside (ended in ${inside})`);
  }
  await shot(page, '03-walked');

  // --- Cottage interior: building ---
  console.log('  Cottage interior + building…');
  await page.evaluate(() => window.__game.enterZone('cottage_in'));
  await waitForFrames(page, 4);
  await shot(page, '04-cottage-interior');

  const before = await probeNumber(page, 'blockCount', () => window.__game.blockCount());

  // Park the cursor before aiming. Moving the mouse is itself a look input —
  // the game applies it, correctly — so aiming first and moving second left the
  // camera pointing at open air by the time the click landed.
  await page.mouse.move(450, 280);   // dead centre, over the canvas
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
  await waitForFrames(page, 3);
  const afterBreak = await probeNumber(page, 'blockCount', () => window.__game.blockCount());
  console.log(`    after removing: ${afterBreak}`);
  if (!(afterBreak < after)) {
    problems.push(`removing a block did not lower the block count (${after} → ${afterBreak})`);
  }

  // --- Talking ---
  console.log('  Talking to a villager…');
  await page.evaluate(() => window.__game.goToNearestNpc());
  await waitForFrames(page, 3);
  await page.keyboard.press('KeyE');
  await waitForFrames(page, 5);
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
  await waitForFrames(page, 3);
  await page.click('#pause .btn.lilac');
  await waitForFrames(page, 4);
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
  await waitForFrames(page, 3);
  await page.fill('#creator input[type="text"]', 'Star');
  await clickByText('🎲 Surprise me');
  await waitForFrames(page, 4);
  const editingBeforeSave = await page.evaluate(() => window.__game && document
    .querySelector('#creator h2').textContent);
  if (editingBeforeSave !== 'Make a character') {
    problems.push(`expected to be making a new character, header said "${editingBeforeSave}"`);
  }
  await clickByText('Save');
  await waitForFrames(page, 4);
  const charCount = await probeNumber(page, 'characterCount', () => window.__game.characterCount());
  console.log(`    characters: ${charCount}`);
  if (!(charCount >= 2)) problems.push(`saving a new character did not add one (${charCount})`);

  // Switching who you're playing as is half of what the creator is for.
  await clickByText('Play as');
  await waitForFrames(page, 5);
  const playingAs = await page.evaluate(() => window.__game.activeCharacterName());
  console.log(`    playing as: ${playingAs}`);
  if (playingAs !== 'Star') problems.push(`switching character failed (playing as ${playingAs})`);
  await shot(page, '08-two-characters');

  await clickByText('Done');
  await waitForFrames(page, 5);

  // --- Shop ---
  //
  // The rule for the shop: money arrives every day but is never shown. So
  // besides buying, this checks there is no number anywhere on the screen.
  console.log('  Shop…');
  const shopText = () => page.evaluate(() => document.getElementById('shop').innerText);
  const noNumbers = async (when) => {
    const text = await shopText();
    if (/\d/.test(text)) problems.push(`the shop shows a number ${when}: "${text.match(/.{0,20}\d.{0,20}/)[0]}"`);
  };
  const status = (id) => page.evaluate((p) => window.__game.packStatus(p), id);

  await page.keyboard.press('Escape');
  await waitForFrames(page, 3);
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('#pause button')]
      .find((b) => b.textContent.includes('Shop'));
    if (!button) throw new Error('no Shop button in the pause menu');
    button.click();
  });
  await waitForFrames(page, 3);
  const shopShown = await page.evaluate(() => !document.getElementById('shop').hidden);
  if (!shopShown) problems.push('the Shop button in the pause menu did not open the shop');
  const statuses = await page.evaluate(() => [...document.querySelectorAll('#shop .pack-card')]
    .map((c) => c.dataset.status));
  console.log(`    first visit: ${statuses.join(', ')}`);
  if (!statuses.includes('buy')) problems.push('nothing in the shop can be bought on the first day');
  if (!statuses.includes('not-yet')) problems.push('every pack was buyable on the first day');
  await noNumbers('on the first visit');
  await shot(page, '09a-shop');

  await page.click('#shop .pack-card[data-pack="candy"] .btn.buy');
  await waitForFrames(page, 4);
  const revealed = await page.evaluate(() => !document.querySelector('#shop .shop-reveal').hidden
    && document.querySelector('#shop .reveal-card h2').textContent);
  console.log(`    bought candy: ${revealed || 'NO REVEAL'}, owned: ${await page.evaluate(() => window.__game.ownedPacks())}`);
  if (revealed !== "It's yours!") problems.push('buying a pack did not show the reveal');
  if ((await status('candy')) !== 'owned') problems.push('buying the candy pack did not make it hers');
  await noNumbers('after buying');
  await shot(page, '09b-shop-bought');
  await page.click('#shop .reveal-card .btn');
  await waitForFrames(page, 2);

  // That was the day's money. Everything else should say "Not yet" now, and
  // pressing it should say so kindly rather than do anything.
  const oceanAfter = await status('ocean');
  if (oceanAfter !== 'not-yet') problems.push(`after spending the day's money, ocean was "${oceanAfter}"`);
  await page.click('#shop .pack-card[data-pack="ocean"] .btn.not-yet');
  await waitForFrames(page, 2);
  const note = await page.textContent('#shop .pack-card[data-pack="ocean"] .pack-note');
  console.log(`    not yet: "${note}"`);
  if (!/come back/i.test(note || '')) problems.push('pressing "Not yet" did not say to come back');
  if ((await status('ocean')) !== 'not-yet') problems.push('pressing "Not yet" bought the pack anyway');

  // Tomorrow, the money is back.
  await page.evaluate(() => window.__game.skipDays(1));
  await waitForFrames(page, 2);
  const tomorrow = await status('ocean');
  console.log(`    next day, ocean: ${tomorrow}`);
  if (tomorrow !== 'buy') problems.push(`a new day did not make a one-day pack buyable (got "${tomorrow}")`);
  await page.click('#shop .pack-card[data-pack="animals"] .btn.buy');
  await waitForFrames(page, 3);
  await page.keyboard.press('Escape');   // closes the reveal
  await waitForFrames(page, 2);
  await page.keyboard.press('Escape');   // closes the shop
  await waitForFrames(page, 3);
  if (await page.evaluate(() => !document.getElementById('shop').hidden)) {
    problems.push('Escape did not close the shop');
  }

  // The new blocks are in their own hotbar tab, already picked.
  await page.evaluate(() => window.__game.enterZone('cottage_in'));
  await waitForFrames(page, 3);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#palette-tabs .tab')]
    .map((t) => t.textContent));
  const picked = await page.evaluate(() => window.__game.ui.selectedBlockId);
  console.log(`    hotbar tabs: ${tabs.join(' | ')}; picked block ${picked}`);
  if (!tabs.some((t) => t.includes('Candy'))) problems.push('the candy blocks have no hotbar tab');
  // Animal Friends was bought last, so its tab is the one that should be open.
  const newestActive = await page.evaluate(() => document.querySelector('#palette-tabs .tab.active')
    ?.textContent.includes('Animals'));
  if (!newestActive) problems.push('the hotbar did not switch to the most recently bought blocks');

  // And the new looks are in the character creator.
  await page.keyboard.press('Escape');
  await waitForFrames(page, 2);
  await page.click('#pause .btn.lilac');
  await waitForFrames(page, 3);
  const extras = await page.evaluate(() => [...document.querySelectorAll('#creator .chip')]
    .map((c) => c.textContent));
  if (!extras.includes('Bunny Ears')) problems.push('Bunny Ears are not in the creator after buying Animal Friends');
  if (extras.includes('Antennae')) problems.push('Antennae show in the creator without buying the Space pack');
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll('#creator .chip')]
      .find((c) => c.textContent === 'Bunny Ears');
    chip?.click();
  });
  await waitForFrames(page, 4);
  await shot(page, '09c-bunny-ears');
  await clickByText('Done');
  await waitForFrames(page, 3);

  // --- Other interiors ---
  for (const zone of ['modern_in', 'bakery_in', 'barn_in', 'library_in']) {
    console.log(`  ${zone}…`);
    await page.evaluate((z) => window.__game.enterZone(z), zone);
    await waitForFrames(page, 4);
    await shot(page, `09-${zone}`);
  }

  // --- Moon house ---
  console.log('  Moon house…');
  await page.evaluate(() => window.__game.enterZone('moon_house'));
  await waitForFrames(page, 5);
  await shot(page, '10-moon-house');
  // Stand at the back of the viewing island, looking up at the whole crescent.
  await page.evaluate(() => window.__game.placeAt([21.5, 2, 59.5], 0, -0.36));
  await waitForFrames(page, 5);
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
  await waitForFrames(page, 4);
  const restored = await probeNumber(page, 'characterCount', () => window.__game.characterCount());
  const restoredZone = await page.evaluate(() => window.__game.zoneId());
  const restoredEdits = await probeNumber(page, 'editCount', () => window.__game.editCount());
  const restoredPacks = await page.evaluate(() => window.__game.ownedPacks());
  console.log(`    after reload — characters: ${restored}, zone: ${restoredZone}, edits: ${restoredEdits}, packs: ${restoredPacks}`);
  if (!(restoredPacks.includes('candy') && restoredPacks.includes('animals'))) {
    problems.push(`bought packs not persisted across reload (got ${restoredPacks})`);
  }
  // Both days' money is spent, so coming back the same day must not pay again.
  const buyableAfterReload = await page.evaluate(() => ['ocean', 'salon', 'rainbow', 'space', 'castle']
    .filter((id) => window.__game.packStatus(id) === 'buy'));
  if (buyableAfterReload.length) {
    problems.push(`reloading paid the day's money again (buyable: ${buyableAfterReload})`);
  }
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
  await waitForFrames(phone, 6);
  await phone.evaluate(() => window.__game.enterZone('cottage_in'));
  await waitForFrames(phone, 6);
  await phone.screenshot({ path: path.join(SHOTS, '14-phone-play.png') });
  const touchVisible = await phone.evaluate(
    () => !document.getElementById('touch').hasAttribute('hidden'),
  );
  console.log(`    touch controls visible: ${touchVisible}`);
  if (!touchVisible) problems.push('touch controls are hidden on a touch device');
  console.log('  📸 13-phone-title, 14-phone-play');

  // --- Touch controls, actually driven ---
  //
  // Sofia plays on a phone as often as a laptop, so these are the controls
  // that matter most. Real touch events through CDP rather than synthesised
  // DOM events, so the same code path a finger takes gets exercised.
  console.log('  Phone controls…');
  const cdp = await phone.context().newCDPSession(phone);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map(([x, y], i) => ({ x, y, id: i })),
  });

  // Joystick: press and drag on the left half, and check she moves.
  const startPos = await phone.evaluate(() => window.__game.state.player.position.toArray());
  await touch('touchStart', [[90, 620]]);
  await waitForFrames(phone, 2);
  const joystickShown = await phone.evaluate(
    () => document.getElementById('joystick').classList.contains('active'),
  );
  for (let i = 0; i < 8; i++) {
    await touch('touchMove', [[90, 560]]);   // push "up" = forward
    await waitForFrames(phone, 2);
  }
  await touch('touchEnd', []);
  await waitForFrames(phone, 2);
  const movedPos = await phone.evaluate(() => window.__game.state.player.position.toArray());
  const walked = Math.hypot(movedPos[0] - startPos[0], movedPos[2] - startPos[2]);
  console.log(`    joystick shown: ${joystickShown}, walked ${walked.toFixed(2)} blocks`);
  if (!joystickShown) problems.push('the virtual joystick did not appear on touch');
  if (!(walked > 0.5)) problems.push(`joystick did not move the player (${walked.toFixed(2)} blocks)`);
  await phone.screenshot({ path: path.join(SHOTS, '15-phone-joystick.png') });

  // Tap-to-place on the right half.
  await phone.evaluate(() => window.__game.setLook(0, 0.85));
  await waitForFrames(phone, 2);
  const beforeTap = await probeNumber(phone, 'blockCount', () => window.__game.blockCount());
  await touch('touchStart', [[300, 420]]);
  await touch('touchEnd', []);
  await waitForFrames(phone, 3);
  const afterTap = await probeNumber(phone, 'blockCount', () => window.__game.blockCount());
  console.log(`    tap-to-place: ${beforeTap} → ${afterTap}`);
  if (!(afterTap > beforeTap)) {
    problems.push(`tap-to-place put no block down (${beforeTap} → ${afterTap})`);
  }

  // The on-screen place and remove buttons.
  const tapButton = async (selector) => {
    const box = await phone.locator(selector).boundingBox();
    if (!box) throw new Error(`${selector} has no box`);
    await touch('touchStart', [[box.x + box.width / 2, box.y + box.height / 2]]);
    await touch('touchEnd', []);
    await waitForFrames(phone, 3);
  };
  await phone.evaluate(() => window.__game.setLook(0, 0.85));
  await waitForFrames(phone, 2);
  const beforeBtn = await probeNumber(phone, 'blockCount', () => window.__game.blockCount());
  await tapButton('#touch-buttons .round-btn >> nth=1');   // ▣ place
  const afterPlaceBtn = await probeNumber(phone, 'blockCount', () => window.__game.blockCount());
  await tapButton('#touch-buttons .round-btn >> nth=0');   // ⛏ remove
  const afterBreakBtn = await probeNumber(phone, 'blockCount', () => window.__game.blockCount());
  console.log(`    place button: ${beforeBtn} → ${afterPlaceBtn}, remove button: → ${afterBreakBtn}`);
  if (!(afterPlaceBtn > beforeBtn)) problems.push('the on-screen place button did nothing');
  if (!(afterBreakBtn < afterPlaceBtn)) problems.push('the on-screen remove button did nothing');

  // Picking a different block from the hotbar by tapping it.
  const firstBlock = await phone.evaluate(() => window.__game.ui.selectedBlockId);
  await tapButton('#hotbar .slot >> nth=3');
  const pickedBlock = await phone.evaluate(() => window.__game.ui.selectedBlockId);
  console.log(`    hotbar tap: block ${firstBlock} → ${pickedBlock}`);
  if (pickedBlock === firstBlock) problems.push('tapping a hotbar slot did not change the block');

  // Talking, via the on-screen Talk button.
  await phone.evaluate(() => window.__game.goToNearestNpc());
  await waitForFrames(phone, 3);
  const talkShown = await phone.evaluate(
    () => !document.getElementById('touch-buttons').querySelector('.wide').hidden,
  );
  if (!talkShown) problems.push('the Talk button did not appear next to a villager');
  else {
    await tapButton('#touch-buttons .wide');
    const spoke = await phone.evaluate(
      () => document.getElementById('dialogue').classList.contains('show'),
    );
    console.log(`    talk button opened dialogue: ${spoke}`);
    if (!spoke) problems.push('the Talk button did not open dialogue');
  }
  await phone.screenshot({ path: path.join(SHOTS, '16-phone-built.png') });
  console.log('  📸 15-phone-joystick, 16-phone-built');

  // The shop, from the 🛍 button, at phone size.
  await tapButton('#shop-btn');
  const phoneShop = await phone.evaluate(() => !document.getElementById('shop').hidden);
  console.log(`    🛍 opened the shop: ${phoneShop}`);
  if (!phoneShop) problems.push('the 🛍 button did not open the shop on a phone');
  const phoneOverflow = await phone.evaluate(
    () => document.querySelector('#shop .shop-card').scrollWidth
      > document.querySelector('#shop .shop-card').clientWidth,
  );
  if (phoneOverflow) problems.push('the shop scrolls sideways on a phone');
  await phone.screenshot({ path: path.join(SHOTS, '19-phone-shop.png') });
  const firstBuy = '#shop .pack-card .btn.buy >> nth=0';
  await phone.locator(firstBuy).scrollIntoViewIfNeeded();
  await tapButton(firstBuy);
  await phone.screenshot({ path: path.join(SHOTS, '20-phone-bought.png') });
  const phoneOwned = await phone.evaluate(() => window.__game.ownedPacks().length);
  if (phoneOwned !== 1) problems.push(`tapping Buy on a phone left ${phoneOwned} packs owned`);
  console.log('  📸 19-phone-shop, 20-phone-bought');

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
