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
  constructor({ edits = {}, castShadows = true, skipMeshing = false } = {}) {
    this.zones = new Map();
    this.edits = edits;
    this.castShadows = castShadows;
    // Layout-only mode: skips building geometry, so the structural checks can
    // run in plain Node without a canvas.
    this.skipMeshing = skipMeshing;
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
    if (!this.skipMeshing) zone.rebuild(this.castShadows);
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

/**
 * Structural checks over every zone: that doors lead somewhere real, that the
 * spawn points they lead to exist, and that you can actually stand where you
 * land. Cheap to run and it catches the kind of mistake — a door pointing at a
 * renamed zone, a spawn buried in a wall — that only shows up when someone
 * walks into it.
 *
 * Returns a list of human-readable problems; empty means everything lines up.
 */
export function validateWorld() {
  const problems = [];
  const world = new World({ castShadows: false, skipMeshing: true });

  const standable = (zone, [x, y, z], label) => {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const fz = Math.floor(z);
    if (!zone.inBounds(fx, fy, fz)) {
      problems.push(`${label} is outside ${zone.id}`);
      return;
    }
    if (zone.isSolidAt(fx, fy, fz) || zone.isSolidAt(fx, fy + 1, fz)) {
      problems.push(`${label} is inside a solid block in ${zone.id}`);
    }
    // Something to land on within a short drop.
    let ground = false;
    for (let drop = 1; drop <= 6; drop++) {
      if (zone.isSolidAt(fx, fy - drop, fz)) { ground = true; break; }
    }
    if (!ground) problems.push(`${label} has no floor under it in ${zone.id}`);
  };

  for (const id of ZONE_IDS) {
    let zone;
    try {
      zone = world.get(id);
    } catch (error) {
      problems.push(`zone "${id}" failed to build: ${error.message}`);
      continue;
    }

    standable(zone, zone.spawn, `default spawn of "${id}"`);

    for (const [key, spawn] of Object.entries(zone.spawns || {})) {
      standable(zone, spawn.pos, `spawn "${key}" of "${id}"`);
    }

    for (const door of zone.doors) {
      if (!DEFINITIONS.has(door.target)) {
        problems.push(`door in "${id}" points at unknown zone "${door.target}"`);
        continue;
      }
      if (door.spawnKey) {
        const target = world.get(door.target);
        if (!target.spawns || !target.spawns[door.spawnKey]) {
          problems.push(`door in "${id}" wants spawn "${door.spawnKey}" in "${door.target}", which doesn't exist`);
        }
      }
      // You have to be able to stand in a doorway for it to trigger.
      let reachable = false;
      for (let x = door.x0; x <= door.x1 && !reachable; x++) {
        for (let z = door.z0; z <= door.z1 && !reachable; z++) {
          for (let y = 0; y < zone.sizeY - 1; y++) {
            if (!zone.isSolidAt(x, y, z) && !zone.isSolidAt(x, y + 1, z)
              && zone.isSolidAt(x, y - 1, z)) {
              reachable = true;
              break;
            }
          }
        }
      }
      if (!reachable) {
        problems.push(`door to "${door.target}" in "${id}" is blocked — nowhere to stand in it`);
      }
    }

    for (const npc of zone.npcs) {
      const fx = Math.floor(npc.x);
      const fz = Math.floor(npc.z);
      if (!zone.inBounds(fx, 1, fz)) {
        problems.push(`villager "${npc.id}" is outside "${id}"`);
      }
    }
  }

  return problems;
}

export { GROUND };
