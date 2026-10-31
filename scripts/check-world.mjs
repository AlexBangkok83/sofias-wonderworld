#!/usr/bin/env node
/**
 * Layout checks for every place — doors, rooms, furniture, who lives where,
 * and the landing rules — without booting a browser. Runs in well under a
 * second, so it's the fast loop when rearranging a house.
 *
 *   npm run check
 */

import { PLACES, START_PLACE, arrivalX, townSpotFor } from '../src/world/places.js';
import { seedThings, seedPerson } from '../src/world/seed.js';
import {
  WORLD_H, floorsOf, landingY, ceilingY,
} from '../src/world/physics.js';
import { THINGS, getThing, drawThing, drawThingFront } from '../src/art/things.js';
import { drawBackdrop } from '../src/art/scenes.js';
import { drawPerson, DEFAULT_CHARACTER } from '../src/art/person.js';
import { VILLAGERS } from '../src/npc/dialogue.js';

const problems = [];
const expect = (ok, message) => { if (!ok) problems.push(message); };

expect(!!PLACES[START_PLACE], `the start place "${START_PLACE}" doesn't exist`);

// --- Every thing can be drawn, and its seats and surfaces are inside it ---

for (const def of THINGS) {
  try {
    drawThing(def, { on: true, bites: 1 }, 'check');
    drawThing(def, {}, 'check');
    drawThingFront(def, { on: true });
  } catch (error) {
    problems.push(`${def.id} can't be drawn: ${error.message}`);
  }
  for (const seat of def.seats || []) {
    expect(seat.x >= 0 && seat.x <= def.w && seat.y >= 0 && seat.y <= def.h, `${def.id} has a seat outside itself`);
    expect(['sit', 'lie'].includes(seat.pose), `${def.id} has a seat with an unknown pose`);
  }
  if (def.surface) {
    const s = def.surface;
    expect(s.x0 >= 0 && s.x1 <= def.w && s.x1 > s.x0 && s.y >= 0 && s.y < def.h, `${def.id} has a broken surface`);
  }
  expect(['furniture', 'item', 'rug', 'wall'].includes(def.layer), `${def.id} has an unknown layer`);
  expect(!(def.holdable && def.layer !== 'item'), `${def.id} is holdable but not a small item`);
  expect(!(def.food && !def.bite), `${def.id} is food with nowhere to bite`);
}
for (const pose of ['stand', 'sit', 'lie', 'held']) drawPerson(DEFAULT_CHARACTER, { pose });

// --- Places ---

const homes = new Map();
for (const place of Object.values(PLACES)) {
  const where = place.id;
  try {
    drawBackdrop(place);
  } catch (error) {
    problems.push(`${where}: the backdrop can't be drawn: ${error.message}`);
  }
  expect(place.ground > 0 && place.ground <= WORLD_H, `${where}: the ground is off the screen`);

  for (const link of place.links) {
    expect(!!PLACES[link.to], `${where}: a door leads to "${link.to}", which doesn't exist`);
    expect(link.x >= 0 && link.x + link.w <= place.w, `${where}: the door to ${link.to} is outside the place`);
  }
  if (where !== 'town') {
    expect(place.links.some((l) => l.to === 'town'), `${where}: there's no way back out to the street`);
    expect(PLACES.town.links.some((l) => l.to === where), `${where}: nothing on the street leads here`);
    const x = arrivalX(place);
    expect(x > 0 && x < place.w, `${where}: people arrive outside the place`);
    const back = townSpotFor(where);
    expect(back > 0 && back < PLACES.town.w, `${where}: leaving puts people off the end of the street`);
  }

  for (const room of place.rooms) {
    expect(room.x >= 0 && room.x + room.w <= place.w && room.y >= 0 && room.y + room.h <= place.ground,
      `${where}: a room at x=${room.x} sticks out of the place`);
  }

  // Drop everything in and see where it lands.
  const things = seedThings(place);
  const floors = floorsOf(place);
  for (const t of things) {
    const def = getThing(t.kind);
    const name = `${where}: ${t.kind} at x=${t.x}`;
    if (!def) { problems.push(`${name} is not a known thing`); continue; }
    expect(!def.pack, `${name} comes from the ${def.pack} pack — places can only start with free things`);
    expect(t.x - def.w / 2 >= 0 && t.x + def.w / 2 <= place.w, `${name} sticks out of the side of the place`);
    expect(t.y - def.h >= 0, `${name} sticks out of the top`);
    if (def.layer === 'wall') continue;
    // Furniture should stand inside one room, not straddle a wall.
    const floor = floors.find((f) => f.y === t.y && t.x >= f.x0 && t.x <= f.x1);
    if (def.layer !== 'item' && floor && floor.y !== place.ground) {
      const room = place.rooms.find((r) => r.y + r.h === t.y && t.x >= r.x && t.x <= r.x + r.w);
      if (room) {
        expect(t.x - def.w / 2 >= room.x - 6 && t.x + def.w / 2 <= room.x + room.w + 6,
          `${name} pokes through the wall of its room`);
      }
    }
    if (place.building && place.id !== 'moon') {
      expect(t.x - def.w / 2 >= place.building.x0 - 6 && t.x + def.w / 2 <= place.building.x1 + 6,
        `${name} pokes out through the outside wall`);
    }
  }

  for (const [key, spec] of Object.entries(place.people)) {
    expect(!!VILLAGERS[key], `${where}: "${key}" lives here but isn't a villager`);
    expect(!homes.has(key), `${key} lives in two places`);
    homes.set(key, where);
    const p = seedPerson(place, things, spec);
    expect(floors.some((f) => f.y === p.y) || things.some((t) => p.y < t.y),
      `${where}: ${key} isn't standing on anything`);
    expect(p.y - 160 >= 0, `${where}: ${key}'s head is off the top of the screen`);
  }
}
for (const key of Object.keys(VILLAGERS)) expect(homes.has(key), `${key} doesn't live anywhere`);

// --- The landing rules ---

{
  const place = PLACES.cottage;
  const table = { uid: 'table', kind: 'table', x: 820, y: 760, st: {} };
  const things = [table];
  const top = 760 - getThing('table').h + getThing('table').surface.y;
  expect(landingY(place, things, { x: 820, y: 500 }) === top, 'an apple dropped over a table should land on it');
  expect(landingY(place, things, { x: 820, y: top + 20 }) === top, 'let go just inside a table top and it should still land on top');
  expect(landingY(place, things, { x: 820, y: 500, onFloorsOnly: true }) === 760, 'furniture should not land on tables');
  expect(landingY(place, things, { x: 1100, y: 500 }) === 760, 'dropped in the living room, it should land on its floor');
  expect(landingY(place, things, { x: 1100, y: 200 }) === 430, 'dropped upstairs, it should land on the upstairs floor');
  expect(landingY(place, [], { x: 820, y: top }) === 760, 'with the table gone, things on it should fall to the floor');
  expect(landingY(place, things, { x: 20, y: 300 }) === place.ground, 'dropped outside the house, it should land on the ground');
  expect(ceilingY(place, 1100, 600) === 450, 'a balloon in the living room should float up to its ceiling');
  expect(ceilingY(place, 20, 600) === 0, 'a balloon outside should float off up into the sky');
}

if (problems.length) {
  console.error(`\n  ✗ ${problems.length} layout problem(s):`);
  for (const problem of problems) console.error(`      • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(`\n  ✓ ${Object.keys(PLACES).length} places, ${THINGS.length} things: doors, rooms, furniture and landings all line up.\n`);
