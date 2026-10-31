/**
 * The piggy bank: in-game money you never see.
 *
 * Sofia's rule: money arrives by itself every day, and there is no number
 * anywhere — not on the screen, not in the shop, not on a pack. She presses
 * Buy and it's hers. If there isn't enough yet, the button says "Not yet".
 *
 * To keep it that way, nothing in src/ui/ is ever handed the balance. The
 * shop is only told, per pack, "owned", "can buy" or "not yet" (see
 * shopView() below). If a number ever shows up on screen, it came from
 * somewhere it shouldn't have — and the smoke test checks for exactly that.
 *
 * Pure functions over a plain object, so they can be checked without a
 * browser (scripts/check-shop.mjs).
 */

import { PACKS, getPack } from './packs.js';

/** Coins that arrive each day. A one-day pack costs exactly this. */
export const DAILY_ALLOWANCE = 10;

/**
 * Days she doesn't play still count, up to this many at once — so a week
 * away is a nice surprise, but a month away isn't the whole shop at once.
 */
export const MAX_DAYS_BANKED = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The local calendar day, as "YYYY-MM-DD". A new day starts at her midnight. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Whole days since 1970 for a "YYYY-MM-DD" key, ignoring time zones. */
function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function emptyBank() {
  return { coins: 0, paidThrough: null };
}

/** Repair whatever came out of a save file into a usable bank. */
export function cleanBank(raw) {
  const bank = emptyBank();
  if (raw && typeof raw === 'object') {
    if (Number.isFinite(raw.coins) && raw.coins > 0) bank.coins = Math.floor(raw.coins);
    if (typeof raw.paidThrough === 'string' && DAY_PATTERN.test(raw.paidThrough)) {
      bank.paidThrough = raw.paidThrough;
    }
  }
  return bank;
}

/**
 * Pay whatever is owed up to and including `today`. Safe to call as often as
 * you like — on boot, when the tab comes back, when the shop opens — because
 * a day is only ever paid once. Returns how many days were paid.
 */
export function payAllowance(bank, today = dayKey()) {
  if (!bank.paidThrough) {
    // Very first visit: today's money is already there, so the shop works
    // the first time she opens it.
    bank.coins += DAILY_ALLOWANCE;
    bank.paidThrough = today;
    return 1;
  }
  const owed = dayNumber(today) - dayNumber(bank.paidThrough);
  if (owed < 0) {
    // The device clock went backwards (or was wrong before and got fixed).
    // Don't pay, but don't leave her waiting until some future date either.
    bank.paidThrough = today;
    return 0;
  }
  if (owed === 0) return 0;
  const days = Math.min(owed, MAX_DAYS_BANKED);
  bank.coins += days * DAILY_ALLOWANCE;
  bank.paidThrough = today;
  return days;
}

export function canAfford(bank, pack) {
  return bank.coins >= pack.price;
}

/**
 * Buy a pack. Changes `bank` and `owned` (a Set of pack ids) only on success.
 * Returns { ok: true, pack } or { ok: false, reason }.
 */
export function buyPack(bank, owned, packId) {
  const pack = getPack(packId);
  if (!pack) return { ok: false, reason: 'unknown' };
  if (owned.has(pack.id)) return { ok: false, reason: 'owned' };
  if (!canAfford(bank, pack)) return { ok: false, reason: 'not-yet' };
  bank.coins -= pack.price;
  owned.add(pack.id);
  return { ok: true, pack };
}

/**
 * What the shop is allowed to know: each pack, and whether it's hers, can be
 * bought now, or not yet. Deliberately no coins and no prices.
 */
export function shopView(bank, owned) {
  return PACKS.map(({ price, ...pack }) => ({
    pack,
    status: owned.has(pack.id) ? 'owned' : bank.coins >= price ? 'buy' : 'not-yet',
  }));
}
