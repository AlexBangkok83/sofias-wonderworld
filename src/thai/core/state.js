/**
 * Everything the app remembers, in one object saved to localStorage.
 *
 * Two point totals, on purpose:
 *   wallet    the spendable balance. Goes up for right answers, down a little
 *             for wrong ones, and down when points are swapped for Robux.
 *   lifetime  everything ever earned. Never goes down. Drives stickers and
 *             levels, so a bad round never takes away a sticker.
 */

import { STICKERS, SHINY_STICKERS } from '../data/deco.js';

const KEY = 'learn-thai:v1';
export const DAILY_GOAL = 100;
export const STICKER_EVERY = 150;

function defaults() {
  return {
    version: 1,
    wallet: 0,
    lifetime: 0,
    history: {},   // 'YYYY-MM-DD' → { earned, lost, right, wrong, rounds, lesson }
    words: {},     // wordId → { box, due, seen, right, wrong }
    chapters: {},  // chapterId → { learned, games: { gameId: bestStars }, plays: { 'game:date': n } }
    stickers: [],  // sticker ids, in the order earned
    swaps: [],     // { id, points, reward, status: pending|done|declined, asked, settled }
    settings: {
      name: 'Sofia',
      roman: true,        // show pronunciation under the Thai
      english: true,      // show the English meaning
      sound: true,
      unlockAll: false,
      penalty: 2,         // points taken for a wrong answer
      dailyCap: 0,        // most points that can be earned in a day; 0 = no cap
      rewardName: 'Robux',
      ratePoints: 0,      // ratePoints points = rateReward Robux; 0 = not set yet
      rateReward: 0,
      pin: null,
    },
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = defaults();
      return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
    }
  } catch { /* private mode or corrupt data: start fresh */ }
  return defaults();
}

/** Saves straight away: the state is small, and points must never be lost to a closed tab. */
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

export const S = () => state;
export const settings = () => state.settings;

export function setSetting(key, value) {
  state.settings[key] = value;
  save();
}

/** Clears learning progress and points. Keeps the grown-up settings (PIN, swap rate). */
export function resetProgress() {
  const keep = state.settings;
  state = defaults();
  state.settings = keep;
  save();
}

// ───────────────────────────── days ─────────────────────────────

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today() {
  return (state.history[dateKey()] ||= { earned: 0, lost: 0, right: 0, wrong: 0, rounds: 0, lesson: false });
}

/** Days played this week (Monday to Sunday). Nothing is ever "lost". */
export function daysThisWeek() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  let n = 0;
  for (let d = new Date(monday); d <= now; d.setDate(d.getDate() + 1)) {
    if (state.history[dateKey(d)]?.rounds > 0) n++;
  }
  return n;
}

// ──────────────────────────── points ────────────────────────────

/** Adds points, respecting the daily cap. Returns what was actually added. */
export function earn(n) {
  const day = today();
  const cap = state.settings.dailyCap;
  if (cap > 0) n = Math.max(0, Math.min(n, cap - day.earned));
  state.wallet += n;
  state.lifetime += n;
  day.earned += n;
  save();
  return n;
}

/** Takes points from the wallet, never below zero. Returns what was actually taken. */
export function lose(n) {
  const taken = Math.min(n, state.wallet);
  state.wallet -= taken;
  today().lost += taken;
  save();
  return taken;
}

export function capReached() {
  const cap = state.settings.dailyCap;
  return cap > 0 && today().earned >= cap;
}

/** Level 1 at 0 points, 2 at 100, 3 at 300, 4 at 600… each level a little longer. */
export function levelInfo(points = state.lifetime) {
  let level = 1;
  while (50 * level * (level + 1) <= points) level++;
  const start = 50 * (level - 1) * level;
  const end = 50 * level * (level + 1);
  return { level, progress: (points - start) / (end - start), toNext: end - points };
}

// ─────────────────────────── stickers ───────────────────────────

/** Awards any stickers that lifetime points have reached. Returns the new ones. */
export function claimStickers() {
  const fresh = [];
  const owned = new Set(state.stickers);
  const due = Math.min(STICKERS.length, Math.floor(state.lifetime / STICKER_EVERY));
  for (const [id, emoji, name] of STICKERS.slice(0, due)) {
    if (!owned.has(id)) { state.stickers.push(id); fresh.push({ id, emoji, name }); }
  }
  if (fresh.length) save();
  return fresh;
}

/** A surprise: sometimes a shiny sticker after a perfect round. */
export function maybeShiny(chance = 0.25) {
  if (Math.random() > chance) return null;
  const owned = new Set(state.stickers);
  const left = SHINY_STICKERS.filter(([id]) => !owned.has(id));
  if (!left.length) return null;
  const [id, emoji, name] = left[Math.floor(Math.random() * left.length)];
  state.stickers.push(id);
  save();
  return { id, emoji, name, shiny: true };
}

export function nextSticker() {
  const owned = new Set(state.stickers);
  const index = STICKERS.findIndex(([id]) => !owned.has(id));
  if (index < 0) return null;
  const [id, emoji, name] = STICKERS[index];
  return { id, emoji, name, at: (index + 1) * STICKER_EVERY };
}

// ─────────────────────────── chapters ───────────────────────────

export function chapterState(id) {
  return (state.chapters[id] ||= { learned: false, games: {}, plays: {} });
}

export function markLearned(id) {
  chapterState(id).learned = true;
  save();
}

export function recordGame(chapterId, gameId, stars) {
  const c = chapterState(chapterId);
  c.games[gameId] = Math.max(c.games[gameId] || 0, stars);
  const k = `${gameId}:${dateKey()}`;
  c.plays[k] = (c.plays[k] || 0) + 1;
  save();
}

/** How many times this game was finished in this chapter today (before this round). */
export function playsToday(chapterId, gameId) {
  return chapterState(chapterId).plays[`${gameId}:${dateKey()}`] || 0;
}

export function recordRound({ right, wrong }) {
  const day = today();
  day.rounds += 1;
  day.right += right;
  day.wrong += wrong;
  save();
}

// ───────────────────────── swap for Robux ─────────────────────────

export function rateSet() {
  return state.settings.ratePoints > 0 && state.settings.rateReward > 0;
}

/** Reward for a number of points, at the current rate. */
export function rewardFor(points) {
  const { ratePoints, rateReward } = state.settings;
  return rateSet() ? Math.floor(points / ratePoints) * rateReward : 0;
}

/** Sofia asks to swap. The points are held until a grown-up approves or declines. */
export function requestSwap(points) {
  const { ratePoints } = state.settings;
  if (!rateSet() || points <= 0 || points > state.wallet || points % ratePoints !== 0) return null;
  const swap = { id: Date.now().toString(36), points, reward: rewardFor(points), status: 'pending', asked: Date.now(), settled: null };
  state.wallet -= points;
  state.swaps.push(swap);
  save();
  return swap;
}

export function settleSwap(id, approve) {
  const swap = state.swaps.find((s) => s.id === id && s.status === 'pending');
  if (!swap) return;
  swap.status = approve ? 'done' : 'declined';
  swap.settled = Date.now();
  if (!approve) state.wallet += swap.points;
  save();
}

export const pendingSwaps = () => state.swaps.filter((s) => s.status === 'pending');
