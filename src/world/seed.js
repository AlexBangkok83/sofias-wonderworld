/**
 * Setting a place up the first time she visits it: every authored thing is
 * dropped in order (so the bread lands on the counter), and the people who
 * live there are stood on the floor.
 *
 * After that the place belongs to her — it's saved exactly as she leaves it,
 * and this never runs for it again.
 */

import { getThing, freshState } from '../art/things.js';
import { landingY } from './physics.js';

/** Things are { uid, kind, x, y, st, heldBy? }; (x, y) is the bottom middle. */
export function seedThings(place) {
  const things = [];
  place.things.forEach(([kind, x, dropY], i) => {
    const def = getThing(kind);
    const thing = { uid: `${place.id}-${i}`, kind, x, y: 0, st: freshState(def) };
    if (def.layer === 'wall') {
      thing.y = dropY + def.h;            // wall things: authored by their top edge
    } else {
      thing.y = landingY(place, things, { x, y: dropY, onFloorsOnly: def.layer !== 'item' });
    }
    things.push(thing);
  });
  return things;
}

/** Where a person first stands: authored as x, or [x, dropFromY]. */
export function seedPerson(place, things, spec) {
  const [x, dropY] = Array.isArray(spec) ? spec : [spec, place.ground - 100];
  return { place: place.id, x, y: landingY(place, things, { x, y: dropY }) };
}
