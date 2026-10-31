/**
 * Where things land. Nothing here is a real physics engine — it's a
 * dollhouse: let go of something and it drops straight down onto the first
 * floor or table top beneath it. That one rule is most of what makes it feel
 * like a toy.
 *
 * Pure functions over plain data, so they're checked without a browser.
 */

import { getThing } from '../art/things.js';

/** Every scene is this tall, in world units. Widths vary. */
export const WORLD_H = 800;

/** Let go a little way into a table or a floor, and it still lands on top. */
export const SNAP = 34;

/** The floors of a place: one per room, plus the ground. */
export function floorsOf(place) {
  const floors = place.rooms.map((r) => ({ x0: r.x, x1: r.x + r.w, y: r.y + r.h }));
  floors.push({ x0: 0, x1: place.w, y: place.ground });
  return floors;
}

/** The tops of tables, counters and shelves in a place. */
export function thingSurfaces(things, skipUid = null) {
  const out = [];
  for (const t of things) {
    if (t.uid === skipUid || t.heldBy) continue;
    const def = getThing(t.kind);
    if (!def?.surface) continue;
    const left = t.x - def.w / 2;
    out.push({
      x0: left + def.surface.x0,
      x1: left + def.surface.x1,
      y: t.y - def.h + def.surface.y,
      uid: t.uid,
    });
  }
  return out;
}

/**
 * Where something dropped with its bottom at (x, y) comes to rest.
 * Furniture and rugs only stand on floors; small things and people can also
 * land on table tops.
 */
export function landingY(place, things, { x, y, onFloorsOnly = false, skipUid = null }) {
  const candidates = onFloorsOnly ? floorsOf(place) : [...floorsOf(place), ...thingSurfaces(things, skipUid)];
  let best = Infinity;
  for (const s of candidates) {
    if (x < s.x0 || x > s.x1) continue;
    if (s.y < y - SNAP) continue;      // above where it was let go
    if (s.y < best) best = s.y;
  }
  return best === Infinity ? place.ground : best;
}

/** How high a balloon floats: up to the ceiling of the room it's in, or the sky. */
export function ceilingY(place, x, y) {
  let best = 0;
  for (const r of place.rooms) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h + SNAP) {
      if (r.y > best) best = r.y;
    }
  }
  return best;
}

/** Keep a box of width w inside the place. */
export function clampX(place, x, w) {
  return Math.max(w / 2, Math.min(place.w - w / 2, x));
}
