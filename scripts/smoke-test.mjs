#!/usr/bin/env node
/**
 * Headless playthrough: boots the built game in Chromium and plays it the way
 * Sofia would — with real mouse drags and real touch events, not by poking
 * the game's state — then checks what actually happened. Screenshots go to
 * shots/.
 *
 *   npm run build && node scripts/smoke-test.mjs
 *
 * Fails loudly on any console error or page exception, so a broken build
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
const check = (ok, message) => { if (!ok) problems.push(message); };

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log(`  📸 ${name}`);
}

const game = (page, fn, arg) => page.evaluate(fn, arg);
const settle = (page, ms = 550) => page.waitForTimeout(ms);

/** A real mouse drag, in small steps, the way a hand moves. */
async function mouseDrag(page, from, to, steps = 14) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
  }
  await page.mouse.up();
  await settle(page);
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
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

  // Voices off: headless Chromium has no speech, and it's not what's tested.
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem('sofias-village-save')) {
        localStorage.setItem('sofias-village-save', JSON.stringify({
          version: 2, characters: [], settings: { voice: false, sounds: false },
        }));
      }
    } catch { /* storage blocked; the test still runs */ }
  });

  console.log('\n  Booting…');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('#title:not([hidden])', { timeout: 30000 });
  await page.waitForFunction(() => !!window.__game);
  await shot(page, '01-title');
  await page.click('#title .btn');
  await settle(page, 300);
  const start = await game(page, () => window.__game.placeId());
  console.log(`    started in: ${start}`);
  check(start === 'cottage', `expected to start in the cottage, got ${start}`);
  await shot(page, '02-cottage');

  const sofia = await game(page, () => window.__game.state.save.characters[0].id);
  const thingAt = (uid) => game(page, (u) => window.__game.thing(u), uid);
  const onScreen = (uid) => game(page, (u) => window.__game.thingOnScreen(u), uid);
  const personAt = (key) => game(page, (k) => window.__game.personOnScreen(k), key);
  const look = (x) => game(page, (v) => window.__game.look(v), x);

  // --- Dropping something into someone's hand, then eating it ---
  console.log('  Hand Mila an apple, and eat it…');
  await look(800);
  const apple = await game(page, () => window.__game.findThing('apple'));
  await mouseDrag(page, await onScreen(apple), await personAt('mila'));
  const held = await thingAt(apple);
  console.log(`    apple held by: ${held?.heldBy}`);
  check(held?.heldBy === 'mila', `dropping the apple on Mila didn't put it in her hand (${held?.heldBy})`);
  for (let i = 0; i < 3; i++) {
    const box = await page.locator('[data-person="mila"] [data-held]').boundingBox();
    if (!box) { problems.push('could not find the apple in Mila\'s hand to tap'); break; }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page, 250);
  }
  const eaten = await thingAt(apple);
  console.log(`    after three bites: ${eaten ? 'still there' : 'all gone'}`);
  check(!eaten, 'three bites didn\'t finish the apple');
  await shot(page, '03-ate-apple');

  // --- Sitting down, and going to bed ---
  console.log('  Sit Sofia on the sofa, put Mila to bed…');
  await look(1100);
  const sofa = await game(page, () => window.__game.findThing('sofa'));
  const seat = await game(page, (u) => window.__game.seatOnScreen(u, 1), sofa);
  await mouseDrag(page, await personAt(sofia), seat);
  const sitting = await game(page, (k) => window.__game.person(k), sofia);
  console.log(`    Sofia is: ${sitting.spot.pose}`);
  check(sitting.spot.pose === 'sit', `Sofia didn't sit on the sofa (${sitting.spot.pose})`);
  await look(500);
  const bed = await game(page, () => window.__game.findThing('bed'));
  const bedSpot = await game(page, (u) => window.__game.seatOnScreen(u, 0), bed);
  await mouseDrag(page, await personAt('mila'), bedSpot);
  const sleeping = await game(page, () => window.__game.person('mila'));
  console.log(`    Mila is: ${sleeping.spot.pose}`);
  check(sleeping.spot.pose === 'lie', `Mila didn't lie down in bed (${sleeping.spot.pose})`);
  await shot(page, '04-sitting-and-sleeping');

  // --- Tapping things ---
  console.log('  Tapping things…');
  for (const kind of ['floorlamp', 'fridge', 'stove', 'toybox']) {
    const uid = await game(page, (k) => window.__game.findThing(k), kind);
    const thing = await thingAt(uid);
    await look(thing.x);
    const p = await onScreen(uid);
    await page.mouse.click(p.x, p.y);
    await settle(page, 150);
    const after = await thingAt(uid);
    check(after.st.on !== thing.st.on, `tapping the ${kind} didn't switch it`);
  }
  await look(500);
  await shot(page, '05-switched-on');

  // --- Things fall when what's under them goes ---
  console.log('  Move the table out from under the cookie…');
  await look(800);
  const table = await game(page, () => window.__game.findThing('table'));
  const cookie = await game(page, () => window.__game.findThing('cookie'));
  const cookieBefore = await thingAt(cookie);
  const tablePos = await onScreen(table);
  await mouseDrag(page, tablePos, { x: tablePos.x + 260, y: tablePos.y });
  const cookieAfter = await thingAt(cookie);
  console.log(`    cookie: y ${cookieBefore.y} → ${cookieAfter.y}`);
  check(cookieAfter.y === 760, `the cookie didn't fall to the floor when its table moved (y=${cookieAfter.y})`);

  // --- Dropping into thin air lands on the floor below ---
  console.log('  Drop the teddy from up high…');
  await look(1000);
  const teddy = await game(page, () => window.__game.findThing('teddy'));
  const teddyPos = await onScreen(teddy);
  const high = await game(page, () => window.__game.toScreen(1100, 180));
  await mouseDrag(page, teddyPos, high);
  const teddyAfter = await thingAt(teddy);
  console.log(`    teddy landed at y=${teddyAfter.y}`);
  check(teddyAfter.y === 430, `the teddy didn't land on the loft floor (y=${teddyAfter.y})`);

  // --- Talking ---
  console.log('  Tap a villager…');
  await look(400);
  const mila = await personAt('mila');
  await page.mouse.click(mila.x, mila.y);
  await settle(page, 200);
  const said = await page.evaluate(() => document.querySelector('.pop-speech')?.textContent || null);
  console.log(`    Mila: ${said ? `"${said}"` : 'NOTHING'}`);
  check(!!said, 'tapping Mila showed no speech bubble');

  // --- The toy box ---
  console.log('  Toy box…');
  const countThings = () => game(page, () => window.__game.things().length);
  const before = await countThings();
  await page.click('#drawer-btn');
  await settle(page, 300);
  await shot(page, '06-toy-box');
  await page.click('#drawer .tile[data-thing="ball"]');
  await settle(page);
  const afterAdd = await countThings();
  console.log(`    things: ${before} → ${afterAdd} after tapping the ball`);
  check(afterAdd === before + 1, 'tapping a toy box tile didn\'t add the thing');
  // Drag a thing out of the drawer by pulling it upwards.
  await page.locator('#drawer .tile[data-thing="plant"]').scrollIntoViewIfNeeded();
  const tile = await page.locator('#drawer .tile[data-thing="plant"]').boundingBox();
  await mouseDrag(page, { x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 },
    { x: tile.x + tile.width / 2, y: tile.y - 260 });
  const afterDrag = await countThings();
  console.log(`    things: ${afterAdd} → ${afterDrag} after dragging a plant out`);
  check(afterDrag === afterAdd + 1, 'dragging a tile out of the toy box didn\'t add the thing');
  // And put it back by dropping it on the drawer.
  const plants = await game(page, () => window.__game.things().filter((t) => t.kind === 'plant').map((t) => t.uid));
  const newest = plants[plants.length - 1];
  await look((await thingAt(newest)).x);
  const drawerBox = await page.locator('#drawer').boundingBox();
  await mouseDrag(page, await onScreen(newest), { x: drawerBox.x + drawerBox.width / 2, y: drawerBox.y + 50 });
  const afterPutAway = await countThings();
  console.log(`    things: ${afterDrag} → ${afterPutAway} after putting it back`);
  check(afterPutAway === afterDrag - 1, 'dropping a thing on the toy box didn\'t put it away');
  await page.click('#drawer .icon-btn');

  // --- The street, and taking someone with you ---
  console.log('  The street…');
  await page.click('#town-btn');
  await settle(page, 300);
  check((await game(page, () => window.__game.placeId())) === 'town', 'the 🏘 button didn\'t go to the street');
  await shot(page, '07-street');
  await look(1300);
  const bakeryDoor = await game(page, () => window.__game.toScreen(1325, 600));
  await page.mouse.click(bakeryDoor.x, bakeryDoor.y);
  await settle(page, 300);
  const inBakery = await game(page, () => window.__game.placeId());
  console.log(`    tapped the bakery: now in ${inBakery}`);
  check(inBakery === 'bakery', `tapping the bakery didn't go in (${inBakery})`);
  await shot(page, '08-bakery');
  await page.click('#town-btn');
  await settle(page, 300);
  await look(900);
  const wren = await personAt('wren');
  const libraryDoor = await game(page, () => window.__game.toScreen(2590, 600));
  await look(900);
  // Carry Wren along the street — the view slides at the edge — to the library.
  await page.mouse.move(wren.x, wren.y);
  await page.mouse.down();
  await page.mouse.move(wren.x + 30, wren.y - 20);
  await page.mouse.move(1090, 560, { steps: 8 });
  await page.waitForFunction(() => window.__game.stage.camX > 1900, null, { timeout: 15000 }).catch(() => {});
  const door = await game(page, () => window.__game.toScreen(2590, 600));
  await page.mouse.move(door.x, door.y, { steps: 6 });
  await page.mouse.up();
  await settle(page);
  const wrenNow = await game(page, () => window.__game.person('wren'));
  const where = await game(page, () => window.__game.placeId());
  console.log(`    dropped Wren on the library door: she's in ${wrenNow.place}, we're in ${where}`);
  check(wrenNow.place === 'library' && where === 'library', `dropping Wren on the library door didn't take her in (${wrenNow.place}/${where})`);
  void libraryDoor;

  // --- The secret ---
  console.log('  Look for the moon house…');
  await page.click('#town-btn');
  await settle(page, 300);
  await look(3200);
  const gap = await game(page, () => window.__game.toScreen(3100, 640));
  await page.mouse.click(gap.x, gap.y);
  await settle(page, 400);
  const moon = await game(page, () => window.__game.placeId());
  const found = await page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' '));
  console.log(`    tapped the gap in the hedge: ${moon} (${found.includes('Moon') ? 'found it!' : 'no toast'})`);
  check(moon === 'moon', `the gap in the hedge didn't lead to the moon house (${moon})`);
  check(found.includes('Moon House'), 'finding the moon house showed no toast');
  await shot(page, '09-moon-house');

  // --- Every place opens ---
  for (const id of ['modern', 'barn', 'library']) {
    await game(page, (p) => window.__game.go(p), id);
    await settle(page, 200);
    await shot(page, `10-${id}`);
  }
  await game(page, () => window.__game.go('cottage'));
  await settle(page, 200);

  // --- Shop ---
  //
  // The rule: money arrives every day but is never shown. So besides buying,
  // this checks there is no number anywhere in the shop.
  console.log('  Shop…');
  const shopText = () => page.evaluate(() => document.getElementById('shop').innerText);
  const noNumbers = async (when) => {
    const text = await shopText();
    if (/\d/.test(text)) problems.push(`the shop shows a number ${when}: "${text.match(/.{0,20}\d.{0,20}/)[0]}"`);
  };
  const status = (id) => game(page, (p) => window.__game.packStatus(p), id);

  const boxStatus = (id) => page.evaluate((p) => document.querySelector(`#shop .pack-box[data-pack="${p}"]`)?.dataset.status, id);
  // Buyable boxes bob gently on the shelf, so don't wait for them to hold still.
  const openBox = async (id) => {
    await page.click(`#shop .pack-box[data-pack="${id}"]`, { force: true });
    await settle(page, 250);
  };

  await page.click('#shop-btn');
  await settle(page, 300);
  check(await page.evaluate(() => !document.getElementById('shop').hidden), 'the 🛍 button did not open the shop');
  const statuses = await page.evaluate(() => [...document.querySelectorAll('#shop .pack-box')].map((c) => c.dataset.status));
  console.log(`    the shelf: ${statuses.join(', ')}`);
  check(statuses.length === 7, `the shelf shows ${statuses.length} packs, not 7`);
  check(statuses.includes('buy'), 'nothing in the shop can be bought on the first day');
  check(statuses.includes('not-yet'), 'every pack was buyable on the first day');
  await noNumbers('on the first visit');
  await shot(page, '11-shop');

  // Tap a box: it opens up big, showing everything inside.
  await openBox('candy');
  const inside = await page.evaluate(() => [...document.querySelectorAll('#shop .pack-detail .inside-item .label')].map((l) => l.textContent));
  console.log(`    inside the candy pack: ${inside.join(', ')}`);
  check(inside.includes('Cupcake') && inside.includes('Gumball Machine'), 'the candy pack page does not show what is inside');
  await noNumbers('on a pack page');
  await shot(page, '12-shop-pack');
  await page.click('#shop .pack-detail .btn.buy');
  await settle(page, 2200);   // the box wobbles, the lid pops, everything jumps out
  const revealed = await page.evaluate(() => !document.querySelector('#shop .shop-reveal').hidden
    && document.querySelector('#shop .unbox h2').textContent);
  const jumpedOut = await page.evaluate(() => document.querySelectorAll('#shop .unbox-item').length);
  console.log(`    bought candy: ${revealed || 'NO UNBOXING'} (${jumpedOut} things jumped out)`);
  check(revealed === "It's yours!", 'buying a pack did not unbox it');
  check(jumpedOut === 5, `${jumpedOut} things jumped out of the candy box, not 5`);
  check((await status('candy')) === 'owned', 'buying the candy pack did not make it hers');
  await noNumbers('after buying');
  await shot(page, '13-shop-unboxing');
  await page.click('#shop .reveal-actions .keep');
  await settle(page, 150);
  check((await boxStatus('candy')) === 'owned', 'the candy box on the shelf does not say it is hers');

  const oceanAfter = await status('ocean');
  check(oceanAfter === 'not-yet', `after spending the day's money, ocean was "${oceanAfter}"`);
  await openBox('ocean');
  await page.click('#shop .pack-detail .btn.not-yet');
  const note = await page.textContent('#shop .pack-detail .pack-note');
  console.log(`    not yet: "${note}"`);
  check(/come back/i.test(note || ''), 'pressing "Not yet" did not say to come back');
  check((await status('ocean')) === 'not-yet', 'pressing "Not yet" bought the pack anyway');
  await page.keyboard.press('Escape');   // back to the shelf
  await settle(page, 150);
  check(await page.evaluate(() => document.querySelector('#shop .pack-detail').hidden), 'Escape did not go back to the shelf');
  check(await page.evaluate(() => !document.getElementById('shop').hidden), 'Escape on a pack page left the shop');

  await game(page, () => window.__game.skipDays(1));
  const tomorrow = await status('ocean');
  console.log(`    next day, ocean: ${tomorrow}`);
  check(tomorrow === 'buy', `a new day did not make a one-day pack buyable (got "${tomorrow}")`);
  check((await boxStatus('ocean')) === 'buy', 'the shelf did not update for the new day');
  await openBox('animals');
  await page.click('#shop .pack-detail .btn.buy');
  await settle(page, 300);
  await page.keyboard.press('Escape');   // stops the unboxing
  await page.keyboard.press('Escape');   // leaves the shop
  await settle(page, 300);
  check(await page.evaluate(() => document.getElementById('shop').hidden), 'Escape did not close the shop');

  // Closing the shop opens the toy box on the new things.
  const tiles = await page.evaluate(() => [...document.querySelectorAll('#drawer:not([hidden]) .tile')].map((t) => t.dataset.thing));
  console.log(`    toy box opened with: ${tiles.slice(0, 6).join(', ')}…`);
  check(tiles.includes('cupcake') && tiles.includes('kitty'), 'the bought things are not in the toy box');
  await page.click('#drawer .tile[data-thing="kitty"]');
  await settle(page);
  check((await game(page, () => window.__game.things().some((t) => t.kind === 'kitty'))), 'a bought kitty could not be brought out');
  await page.click('#drawer .icon-btn');
  await shot(page, '14-kitty');

  // --- Characters ---
  console.log('  Character creator…');
  await page.keyboard.press('Escape');
  await page.click('#pause .btn.lilac');
  await settle(page, 200);
  const chips = await page.evaluate(() => [...document.querySelectorAll('#creator .chip')].map((c) => c.textContent));
  check(chips.includes('Bunny Ears'), 'Bunny Ears are not in the creator after buying Animal Friends');
  check(!chips.includes('Antennae'), 'Antennae show in the creator without buying the Space pack');
  const clickByText = (label) => page.evaluate((text) => {
    const button = [...document.querySelectorAll('#creator button')].find((b) => b.textContent.trim() === text);
    if (!button) throw new Error(`no button labelled "${text}"`);
    button.click();
  }, label);
  await clickByText('+ New character');
  await page.fill('#creator input[type="text"]', 'Star');
  await clickByText('🎲 Surprise me');
  await clickByText('Bunny Ears');
  await shot(page, '15-creator');
  await clickByText('Save');
  await settle(page, 200);
  const count = await game(page, () => window.__game.characterCount());
  const star = await game(page, () => window.__game.state.save.characters.find((c) => c.name === 'Star')?.id);
  const starHere = await game(page, (k) => window.__game.peopleHere().includes(k), star);
  console.log(`    characters: ${count}; Star is here: ${starHere}`);
  check(count === 2, `saving a new character did not add one (${count})`);
  check(starHere, 'a new character did not appear in the house');
  await clickByText('Done');
  await settle(page, 300);
  await shot(page, '16-star');

  // Start over asks twice, in the page itself (pop-up dialogs don't show on
  // claude.ai). One tap must not wipe anything.
  await page.keyboard.press('Escape');
  await page.click('#start-over');
  const armed = await page.textContent('#start-over');
  check(/again/i.test(armed || ''), `one tap on Start over didn't ask to tap again ("${armed}")`);
  check((await game(page, () => window.__game.characterCount())) === 2, 'one tap on Start over wiped the village');
  await page.keyboard.press('Escape');
  await settle(page, 200);

  // --- Persistence ---
  console.log('  Save + reload…');
  await game(page, () => window.__game.saveNow());
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game, null, { timeout: 30000 });
  await settle(page, 200);
  const restored = {
    place: await game(page, () => window.__game.placeId()),
    characters: await game(page, () => window.__game.characterCount()),
    sofia: await game(page, (k) => window.__game.person(k).spot.pose, sofia),
    apple: await game(page, (u) => !!window.__game.thing(u), apple),
    packs: await game(page, () => window.__game.ownedPacks()),
    wren: await game(page, () => window.__game.person('wren').place),
  };
  console.log(`    after reload: ${JSON.stringify(restored)}`);
  check(restored.place === 'cottage', `didn't come back to the same place (${restored.place})`);
  check(restored.characters === 2, 'characters were not saved');
  check(restored.sofia === 'sit', 'Sofia was not still sitting on the sofa');
  check(!restored.apple, 'the eaten apple came back');
  check(restored.packs.includes('candy') && restored.packs.includes('animals'), 'bought packs were not saved');
  check(restored.wren === 'library', 'Wren forgot she went to the library');
  const buyable = await game(page, () => ['ocean', 'salon', 'rainbow', 'space', 'castle']
    .filter((id) => window.__game.packStatus(id) === 'buy'));
  check(!buyable.length, `reloading paid the day's money again (buyable: ${buyable})`);

  // --- On a phone, with real touches ---
  console.log('  Phone…');
  const phone = await browser.newPage({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  phone.on('pageerror', (error) => problems.push(`phone pageerror: ${error.message}`));
  await phone.addInitScript(() => {
    try {
      localStorage.setItem('sofias-village-save', JSON.stringify({ version: 2, settings: { voice: false, sounds: false } }));
    } catch { /* fine */ }
  });
  await phone.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await phone.waitForFunction(() => !!window.__game, null, { timeout: 30000 });
  await phone.tap('#title .btn');
  await settle(phone, 300);
  await phone.screenshot({ path: path.join(SHOTS, '16-phone.png') });
  const cdp = await phone.context().newCDPSession(phone);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: points.map(([x, y], i) => ({ x, y, id: i })),
  });
  const touchDrag = async (from, to, steps = 10) => {
    await touch('touchStart', [[from.x, from.y]]);
    for (let i = 1; i <= steps; i++) {
      await touch('touchMove', [[from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps]]);
    }
    await touch('touchEnd', []);
    await settle(phone);
  };
  await phone.evaluate(() => window.__game.look(300));
  const bread = await phone.evaluate(() => window.__game.findThing('bread'));
  const breadFrom = await phone.evaluate((u) => window.__game.thing(u), bread);
  const breadPos = await phone.evaluate((u) => window.__game.thingOnScreen(u), bread);
  await touchDrag(breadPos, { x: breadPos.x - 120, y: breadPos.y - 40 });
  const breadTo = await phone.evaluate((u) => window.__game.thing(u), bread);
  console.log(`    dragged the bread with a finger: x ${breadFrom.x} → ${Math.round(breadTo.x)}, y ${breadTo.y}`);
  check(Math.abs(breadTo.x - breadFrom.x) > 50, 'a finger drag did not move the bread');
  check(breadTo.y === 760, `the bread didn't drop to the floor (y=${breadTo.y})`);

  // Slide the view with a finger on the background — on the street, which is
  // wider than the screen (a whole house fits on a phone held sideways).
  await phone.evaluate(() => window.__game.go('town'));
  await settle(phone, 200);
  const camBefore = await phone.evaluate(() => window.__game.stage.camX);
  await touchDrag({ x: 600, y: 60 }, { x: 300, y: 60 });
  const camAfter = await phone.evaluate(() => window.__game.stage.camX);
  console.log(`    swiped the background: view ${Math.round(camBefore)} → ${Math.round(camAfter)}`);
  check(camAfter > camBefore + 50, 'swiping the background did not slide the view');

  // Two fingers, two things at once.
  await phone.evaluate(() => window.__game.go('cottage'));
  await phone.evaluate(() => window.__game.look(1000));
  const lampUid = await phone.evaluate(() => window.__game.findThing('floorlamp'));
  const plantUid = await phone.evaluate(() => window.__game.findThing('plant'));
  const a0 = await phone.evaluate((u) => window.__game.thing(u), lampUid);
  const b0 = await phone.evaluate((u) => window.__game.thing(u), plantUid);
  const a = await phone.evaluate((u) => window.__game.thingOnScreen(u), lampUid);
  const b = await phone.evaluate((u) => window.__game.thingOnScreen(u), plantUid);
  await touch('touchStart', [[a.x, a.y], [b.x, b.y]]);
  for (let i = 1; i <= 8; i++) await touch('touchMove', [[a.x - i * 12, a.y], [b.x - i * 12, b.y]]);
  await touch('touchEnd', []);
  await settle(phone);
  const a1 = await phone.evaluate((u) => window.__game.thing(u), lampUid);
  const b1 = await phone.evaluate((u) => window.__game.thing(u), plantUid);
  console.log(`    two fingers: lamp moved ${Math.round(a0.x - a1.x)}, plant moved ${Math.round(b0.x - b1.x)}`);
  check(a0.x - a1.x > 40 && b0.x - b1.x > 40, 'two fingers could not move two things at once');

  // The shop from the 🛍 button, at phone size.
  await phone.tap('#shop-btn');
  await settle(phone, 200);
  check(await phone.evaluate(() => !document.getElementById('shop').hidden), 'the 🛍 button did not open the shop on a phone');
  // The shelf slides sideways; the page itself must not.
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, 'the shop makes the page scroll sideways on a phone');
  await phone.screenshot({ path: path.join(SHOTS, '17-phone-shop.png') });
  const firstBox = phone.locator('#shop .pack-box[data-status="buy"]').first();
  await firstBox.tap({ force: true });
  await settle(phone, 300);
  // Held sideways, the pack page has to fit with its button on screen.
  const buyBtn = phone.locator('#shop .pack-detail .btn.buy');
  const btnBox = await buyBtn.boundingBox();
  check(!!btnBox && btnBox.y + btnBox.height <= 390, 'the Buy button is off the bottom of a sideways phone');
  await buyBtn.tap();
  await settle(phone, 2200);
  await phone.screenshot({ path: path.join(SHOTS, '18-phone-bought.png') });
  const phonePacks = await phone.evaluate(() => window.__game.ownedPacks().length);
  check(phonePacks === 1, `tapping Buy on a phone left ${phonePacks} packs owned`);
  // "Play with them!" goes straight to the new things.
  await phone.tap('#shop .reveal-actions .play');
  await settle(phone, 300);
  const afterPlay = await phone.evaluate(() => ({
    shop: !document.getElementById('shop').hidden,
    drawer: !document.getElementById('drawer').hidden,
    creator: !document.getElementById('creator').hidden,
  }));
  check(!afterPlay.shop && (afterPlay.drawer || afterPlay.creator), `"Play with them!" didn't go to the new things (${JSON.stringify(afterPlay)})`);
  console.log('  📸 16-phone, 17-phone-shop, 18-phone-bought');

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
