import { Zone } from './zone.js';
import { INTERIORS } from './interiors.js';
import { MOON_ZONE } from './moonhouse.js';
import {
  buildVillage, VILLAGE_SIZE, VILLAGE_DOORS, VILLAGE_SPAWNS, VILLAGE_NPCS, GROUND,
} from './village.js';

/** Every place you can be, keyed by id. */
const DEFINITIONS = new Map();

DEFINITIONS.set('village', {
  id: 'village',
  label: 'The Village',
  size: VILLAGE_SIZE,
  editable: false,          // Sofia's rule: no building outdoors
  indoor: false,
  spawn: VILLAGE_SPAWNS.start.pos,
  spawnYaw: VILLAGE_SPAWNS.start.yaw,
  build: buildVillage,
  doors: VILLAGE_DOORS,
  npcs: VILLAGE_NPCS,
  spawns: VILLAGE_SPAWNS,
});

for (const def of [...INTERIORS, MOON_ZONE]) DEFINITIONS.set(def.id, def);

export const ZONE_IDS = [...DEFINITIONS.keys()];

export function getZoneDefinition(id) {
  return DEFINITIONS.get(id) || null;
}

/**
 * Builds zones on demand and keeps them alive once built, so stepping back
 * into a room you decorated is instant and nothing is lost.
 */
export class World {
  constructor({ edits = {}, castShadows = true } = {}) {
    this.zones = new Map();
    this.edits = edits;
    this.castShadows = castShadows;
  }

  has(id) {
    return this.zones.has(id);
  }

  get(id) {
    if (this.zones.has(id)) return this.zones.get(id);
    const def = DEFINITIONS.get(id);
    if (!def) throw new Error(`Unknown zone "${id}"`);

    const zone = new Zone({
      id: def.id,
      label: def.label,
      size: def.size,
      editable: def.editable,
      indoor: def.indoor,
      spawn: def.spawn,
      spawnYaw: def.spawnYaw || 0,
      ambient: def.ambient,
    });
    zone.night = !!def.night;
    def.build(zone);
    zone.snapshotBaseline();

    // Layer Sofia's saved edits on top of the authored layout.
    if (this.edits[id]) zone.applyEdits(this.edits[id]);

    zone.doors = (def.doors || []).map((d) => ({ ...d }));
    zone.npcs = (def.npcs || []).map((n) => ({ ...n }));
    zone.spawns = def.spawns || null;
    zone.rebuild(this.castShadows);
    this.zones.set(id, zone);
    return zone;
  }

  /** Resolve where the player should appear when entering a zone. */
  spawnFor(zoneId, spawnKey) {
    const zone = this.get(zoneId);
    if (spawnKey && zone.spawns && zone.spawns[spawnKey]) {
      const s = zone.spawns[spawnKey];
      return { pos: s.pos.slice(), yaw: s.yaw };
    }
    return { pos: zone.spawn.slice(), yaw: zone.spawnYaw };
  }

  /** Collect every zone's player edits for saving. */
  collectEdits() {
    const out = {};
    for (const [id, zone] of this.zones) {
      const edits = zone.collectEdits();
      if (Object.keys(edits).length) out[id] = edits;
    }
    // Keep edits for zones that were never opened this session.
    for (const id of Object.keys(this.edits)) {
      if (!out[id] && !this.zones.has(id)) out[id] = this.edits[id];
    }
    return out;
  }
}

export { GROUND };
