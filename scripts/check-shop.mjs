#!/usr/bin/env node
/**
 * Checks for the shop and the hidden piggy bank, without a browser.
 *
 *   npm run check
 *
 * Covers the daily money (paid once a day, missed days counted up to a cap,
 * a clock that goes backwards doesn't strand her), buying, that the shop is
 * never handed a number, and that every pack actually has something in it.
 */

import { PACKS, getPack } from '../src/shop/packs.js';
import {
  DAILY_ALLOWANCE, MAX_DAYS_BANKED, emptyBank, cleanBank, payAllowance, buyPack, shopView,
} from '../src/shop/piggybank.js';
import { BLOCKS, paletteBlocks, packBlocks } from '../src/world/blocks.js';
import {
  HAIR_STYLES, HAIR_COLORS, ACCESSORIES, SKIN_TONES, CLOTH_COLORS, BODY_TYPES,
  packLooks, randomCharacter,
} from '../src/player/avatar.js';

const problems = [];
const expect = (ok, message) => { if (!ok) problems.push(message); };

// --- The catalogue holds together ---

const ids = PACKS.map((p) => p.id);
expect(new Set(ids).size === ids.length, 'two packs share an id');
for (const pack of PACKS) {
  const blocks = packBlocks(pack.id).length;
  const looks = packLooks(pack.id).length;
  expect(blocks + looks > 0, `pack "${pack.id}" has nothing in it`);
  expect(Number.isInteger(pack.price) && pack.price > 0, `pack "${pack.id}" has no sensible price`);
  for (const field of ['name', 'tab', 'emoji', 'blurb', 'color']) {
    expect(typeof pack[field] === 'string' && pack[field], `pack "${pack.id}" is missing ${field}`);
  }
  // The shop must never show a number, so a pack's own words can't have one.
  for (const field of ['name', 'tab', 'blurb']) {
    expect(!/\d/.test(pack[field]), `pack "${pack.id}" ${field} contains a digit`);
  }
}
const tagged = [
  ...[...BLOCKS.values()].map((b) => ['block', b.key, b.pack]),
  ...[HAIR_STYLES, HAIR_COLORS, ACCESSORIES, SKIN_TONES, CLOTH_COLORS, BODY_TYPES]
    .flatMap((list) => list.map((e) => ['look', e.id, e.pack])),
];
for (const [kind, id, pack] of tagged) {
  if (pack !== undefined) expect(!!getPack(pack), `${kind} "${id}" belongs to unknown pack "${pack}"`);
}
expect(
  PACKS.some((p) => p.price <= DAILY_ALLOWANCE),
  'nothing in the shop can be bought on the first day',
);

// --- Locked things stay out of the hotbar and the character creator ---

const starter = paletteBlocks(new Set());
expect(
  starter.every((g) => g.blocks.every((b) => !b.pack)),
  'a pack block shows in the hotbar before the pack is bought',
);
const withCandy = paletteBlocks(new Set(['candy']));
const candyTab = withCandy.find((g) => g.key === 'candy');
expect(!!candyTab, 'buying the candy pack did not add a Candy tab');
expect(
  candyTab && candyTab.blocks.length === packBlocks('candy').length,
  'the Candy tab is missing some of the candy blocks',
);
for (let i = 0; i < 400; i++) {
  const c = randomCharacter('x', new Set());
  const locked = [
    [HAIR_STYLES, c.hair], [HAIR_COLORS, c.hairColor], [ACCESSORIES, c.accessory],
  ].find(([list, id]) => list.find((e) => e.id === id)?.pack);
  if (locked) {
    problems.push(`"Surprise me" picked "${locked[1]}" from a pack she doesn't own`);
    break;
  }
}

// --- The daily money ---

{
  const bank = emptyBank();
  expect(payAllowance(bank, '2026-11-01') === 1, 'the very first visit should pay one day');
  expect(bank.coins === DAILY_ALLOWANCE, 'first visit paid the wrong amount');
  expect(payAllowance(bank, '2026-11-01') === 0, 'the same day paid twice');
  expect(payAllowance(bank, '2026-11-02') === 1, 'the next day did not pay');
  expect(payAllowance(bank, '2026-11-05') === 3, 'three missed days did not pay three days');
  expect(
    payAllowance(bank, '2026-12-25') === MAX_DAYS_BANKED,
    `a long gap should pay at most ${MAX_DAYS_BANKED} days`,
  );
  expect(payAllowance(bank, '2027-01-01') === 7, 'paying across a new year went wrong');
  const before = bank.coins;
  expect(payAllowance(bank, '2026-06-01') === 0, 'a clock that went backwards paid out');
  expect(bank.coins === before, 'a clock that went backwards changed the balance');
  expect(payAllowance(bank, '2026-06-02') === 1, 'after the clock went back, the next day did not pay');
}
{
  // Clocks change on these nights in Europe and the US; a day is still a day.
  const bank = emptyBank();
  payAllowance(bank, '2027-03-27');
  expect(payAllowance(bank, '2027-03-28') === 1, 'the night the clocks go forward broke the count');
  payAllowance(bank, '2027-10-30');
  expect(payAllowance(bank, '2027-10-31') === 1, 'the night the clocks go back broke the count');
}

// --- Buying ---

{
  const cheap = PACKS.find((p) => p.price === DAILY_ALLOWANCE);
  const dear = [...PACKS].sort((a, b) => b.price - a.price)[0];
  const bank = emptyBank();
  const owned = new Set();
  payAllowance(bank, '2026-11-01');

  const no = buyPack(bank, owned, dear.id);
  expect(!no.ok && no.reason === 'not-yet', 'bought a pack there was not enough for');
  expect(bank.coins === DAILY_ALLOWANCE && !owned.has(dear.id), 'a failed buy still changed something');

  const yes = buyPack(bank, owned, cheap.id);
  expect(yes.ok, 'could not buy a one-day pack on day one');
  expect(owned.has(cheap.id) && bank.coins === 0, 'buying did not take the money or give the pack');
  const again = buyPack(bank, owned, cheap.id);
  expect(!again.ok && again.reason === 'owned', 'bought the same pack twice');
  expect(!buyPack(bank, owned, 'nope').ok, 'bought a pack that does not exist');

  // Saving up for the big one.
  const days = Math.ceil(dear.price / DAILY_ALLOWANCE);
  payAllowance(bank, `2026-11-${String(1 + days).padStart(2, '0')}`);
  expect(buyPack(bank, owned, dear.id).ok, `saving for ${days} days did not buy the dearest pack`);
}

// --- The shop never sees the money ---

{
  const bank = emptyBank();
  payAllowance(bank, '2026-11-01');
  const owned = new Set([PACKS[0].id]);
  const view = shopView(bank, owned);
  const text = JSON.stringify(view);
  expect(!/coins|price/i.test(text), 'shopView() leaks the balance or a price to the shop');
  expect(view.every((v) => ['owned', 'buy', 'not-yet'].includes(v.status)), 'shopView() gave a strange status');
  expect(view[0].status === 'owned', 'an owned pack was not shown as owned');
  expect(view.some((v) => v.status === 'buy'), 'nothing was buyable with a day of money');
  expect(view.some((v) => v.status === 'not-yet'), 'the dear packs were buyable on day one');
}

// --- Whatever a save file contains, the bank comes out usable ---

{
  const odd = [null, 'nope', 7, { coins: -5 }, { coins: 'lots' }, { paidThrough: 'tuesday' },
    { coins: 12.7, paidThrough: '2026-11-01' }];
  const cleaned = odd.map(cleanBank);
  expect(cleaned.every((b) => Number.isInteger(b.coins) && b.coins >= 0), 'cleanBank kept a bad balance');
  expect(cleaned[5].paidThrough === null, 'cleanBank kept a bad date');
  expect(cleaned[6].coins === 12 && cleaned[6].paidThrough === '2026-11-01', 'cleanBank dropped a good bank');
}

if (problems.length) {
  console.error(`\n  ✗ ${problems.length} shop problem(s):`);
  for (const problem of problems) console.error(`      • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(`\n  ✓ Shop: ${PACKS.length} packs, money arrives once a day, and the shop never sees it.\n`);
