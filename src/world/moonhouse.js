import { Build } from './builder.js';

// The secret moon house.
//
// From Sofia's Pinterest reference: a crescent-moon-shaped build, sliced open
// so you can see every floor at once, with a tall glass atrium and vines
// hanging down through it.
//
// It gets its own zone rather than living in the village, for two reasons:
// it needs a night sky the village doesn't have, and it is a house — so under
// her "building is inside houses only" rule, it has to be editable.

// Crescent geometry, in the zone's X/Y plane, extruded along Z.
//
// The silhouette is one disc with a second, offset disc bitten out of it. The
// horns fall where the two circles cross, at roughly (34, 6) and (34, 28).
// Floor heights are picked to land where the crescent is thick enough to hold
// a room — near the very top and bottom it narrows to a point.
const CX = 24;      // centre of the outer disc
const CY = 17;
const R_OUT = 15;
const R_IN = 12;    // the disc that bites the crescent open
const OFFSET = 6;   // how far right the biting disc sits
const Z_BACK = 13;  // back wall
const Z_FRONT = 29; // open face — this is the "sliced" side
const FLOORS = [8, 14, 20, 26];

// The viewing island, far enough back that the whole crescent fits in frame.
const ISLAND_Z0 = 42;
const ISLAND_Z1 = 61;
const STAIR_X0 = 13;   // internal stairwell
const STAIR_X1 = 16;
const BRIDGE_X0 = 19;  // causeway in, aligned with the lowest floor
const BRIDGE_X1 = 23;

function inCrescent(x, y) {
  const outer = Math.hypot(x - CX, y - CY);
  if (outer > R_OUT) return false;
  const inner = Math.hypot(x - (CX + OFFSET), y - CY);
  return inner >= R_IN;
}

/** True when the cell sits on the crescent's silhouette edge. */
function isEdge(x, y) {
  if (!inCrescent(x, y)) return false;
  return (
    !inCrescent(x + 1, y) || !inCrescent(x - 1, y) ||
    !inCrescent(x, y + 1) || !inCrescent(x, y - 1)
  );
}

/** True on the concave (inner) edge — the side that becomes the glass atrium. */
function isInnerEdge(x, y) {
  if (!isEdge(x, y)) return false;
  const inner = Math.hypot(x - (CX + OFFSET), y - CY);
  return inner < R_IN + 1.6;
}

export const MOON_ZONE = {
  id: 'moon_house',
  label: 'The Moon House',
  size: [48, 40, 64],
  editable: true,
  indoor: true,
  night: true,
  spawn: [21.5, 2, 56.5],
  spawnYaw: 0,
  ambient: { sky: 0x6f74b8, ground: 0x2b2740, hemi: 1.15, sun: 0.55, fog: 0x232144 },
  build(zone) {
    const b = new Build(zone);

    // The island you arrive on. You land here facing the crescent from far
    // enough away to take the whole thing in — the reveal is the point.
    b.box(6, 0, ISLAND_Z0, 41, 0, ISLAND_Z1 + 1, 'darkstone');
    b.box(8, 1, ISLAND_Z0 + 1, 39, 1, ISLAND_Z1, 'moonstone');
    b.box(11, 1, ISLAND_Z0 + 2, 36, 1, ISLAND_Z1 - 1, 'stone');
    b.scatter(11, ISLAND_Z0 + 2, 36, ISLAND_Z1 - 1, 2, {
      density: 0.12, kinds: ['tuft', 'flower_pink', 'flower_yellow'], seed: 7,
    });

    // Ground the crescent sits on.
    b.box(4, 0, Z_BACK - 3, 44, 0, Z_FRONT + 3, 'darkstone');
    b.box(6, 1, Z_BACK - 1, 42, 1, Z_FRONT + 2, 'stone');

    // ---- The crescent shell -------------------------------------------
    // Every cell inside the silhouette becomes either wall (on the edge) or
    // open air. The z = Z_FRONT face is left off entirely: that is the slice.
    for (let y = 2; y < zone.sizeY - 2; y++) {
      for (let x = 2; x < zone.sizeX - 2; x++) {
        if (!inCrescent(x, y)) continue;
        const edge = isEdge(x, y);
        for (let z = Z_BACK; z <= Z_FRONT; z++) {
          if (edge) {
            // The inner curve is glazed — this is the atrium wall.
            b.set(x, y, z, isInnerEdge(x, y) ? 'glass' : 'moonstone');
          } else if (z === Z_BACK) {
            b.set(x, y, z, 'plaster');
          } else {
            b.set(x, y, z, 'air');
          }
        }
      }
    }

    // Rim the open face in dark stone so the cutaway reads as deliberate.
    for (let y = 2; y < zone.sizeY - 2; y++) {
      for (let x = 2; x < zone.sizeX - 2; x++) {
        if (isEdge(x, y)) b.set(x, y, Z_FRONT, 'darkstone');
      }
    }

    // ---- Floors --------------------------------------------------------
    for (const [level, fy] of FLOORS.entries()) {
      for (let x = 2; x < zone.sizeX - 2; x++) {
        if (!inCrescent(x, fy)) continue;
        if (isEdge(x, fy)) continue;
        for (let z = Z_BACK + 1; z < Z_FRONT; z++) {
          // Hole in every floor but the lowest, for the stairs to come up.
          const stairwell = level > 0
            && x >= STAIR_X0 && x <= STAIR_X1
            && z >= Z_BACK + 1 && z <= Z_BACK + 6;
          b.set(x, fy, z, stairwell ? 'air' : 'oak');
        }
      }
      // Balcony rail along the sliced-open edge, so each floor reads as a
      // floor from outside and she can't walk off one by accident.
      for (let x = 2; x < zone.sizeX - 2; x++) {
        if (!inCrescent(x, fy) || isEdge(x, fy)) continue;
        // Gap where the entrance causeway lands on the lowest floor.
        if (level === 0 && x >= BRIDGE_X0 && x <= BRIDGE_X1) continue;
        b.set(x, fy + 1, Z_FRONT - 1, 'fence');
      }
    }

    // ---- Stairs between floors ----------------------------------------
    for (let i = 0; i < FLOORS.length - 1; i++) {
      const from = FLOORS[i];
      const rise = FLOORS[i + 1] - from;
      for (let step = 1; step <= rise; step++) {
        b.box(STAIR_X0, from + step, Z_BACK + step, STAIR_X1, from + step, Z_BACK + step, 'darkstone');
      }
    }

    // ---- Atrium planting: vines hanging down the glass -----------------
    for (const fy of FLOORS) {
      for (let x = 2; x < zone.sizeX - 2; x++) {
        if (!inCrescent(x, fy) || isEdge(x, fy)) continue;
        if (!inCrescent(x + 1, fy) || isInnerEdge(x + 1, fy)) {
          // Right against the atrium glass — trail vines from the floor edge.
          for (let drop = 1; drop <= 4; drop++) {
            for (const z of [Z_BACK + 3, Z_BACK + 7, Z_BACK + 11]) {
              b.set(x, fy - drop, z, 'vine');
            }
          }
          b.set(x, fy + 1, Z_BACK + 5, 'leaves');
          b.set(x, fy + 1, Z_BACK + 9, 'flower_pink');
        }
      }
    }

    // ---- Light ---------------------------------------------------------
    // Lanterns along the back wall of each floor, plus a couple of moonstone
    // lamps hung out towards the open face so the floors glow from outside.
    for (const fy of FLOORS) {
      for (let x = 10; x < 24; x += 3) {
        if (!inCrescent(x, fy + 1) || isEdge(x, fy + 1)) continue;
        if (x >= STAIR_X0 && x <= STAIR_X1) continue;      // not over the stairwell
        b.set(x, fy + 1, Z_BACK + 1, 'lantern');
        b.set(x, fy + 4, Z_FRONT - 4, 'moonstone');
      }
    }

    // Lowest floor: a rug set into the floor, one anchor piece, then it's hers.
    b.box(14, FLOORS[0], Z_BACK + 8, 19, FLOORS[0], Z_BACK + 13, 'rug');
    b.box(13, FLOORS[0] + 1, Z_BACK + 9, 13, FLOORS[0] + 3, Z_BACK + 12, 'bookshelf');

    // A moonstone causeway from the island, rising through the open front face
    // and landing on the lowest floor. Its x range is chosen to overlap that
    // floor, which sits to the left of the crescent's bite.
    b.box(BRIDGE_X0, 1, 33, BRIDGE_X1, 1, ISLAND_Z0, 'moonstone');
    for (let i = 1; i <= FLOORS[0] - 1; i++) {
      b.box(BRIDGE_X0, 1 + i, 33 - i, BRIDGE_X1, 1 + i, 33 - i, 'moonstone');
    }

    // Lanterns down the causeway, set off to the sides so they don't block the
    // view of the crescent on the way in.
    b.lampPosts([
      [BRIDGE_X0 - 3, 38], [BRIDGE_X1 + 3, 38],
      [BRIDGE_X0 - 3, 45], [BRIDGE_X1 + 3, 45],
      [BRIDGE_X0 - 3, 52], [BRIDGE_X1 + 3, 52],
    ], 2, 3);
  },
  doors: [
    {
      x0: 12, x1: 34, z0: ISLAND_Z1, z1: ISLAND_Z1 + 2,
      target: 'village', spawnKey: 'moongate', label: 'Back to the village',
    },
  ],
  npcs: [
    { id: 'luna', x: 17.5, z: 54.5, yaw: 0 },
  ],
};

/**
 * The way in, built into the village: a moonstone arch at the back of a hidden
 * grove. Walking through it is what makes the moon house feel found rather
 * than listed on a menu.
 */
export function buildMoonGate(build, x, y, z) {
  const b = build.at(x, y, z);
  b.box(-3, 0, 0, 3, 0, 2, 'darkstone');
  b.box(-2, 1, 0, 2, 1, 2, 'moonstone');
  // Arch uprights and curve.
  for (const sx of [-3, 3]) b.box(sx, 1, 1, sx, 5, 1, 'moonstone');
  b.box(-2, 6, 1, 2, 6, 1, 'moonstone');
  b.set(-3, 6, 1, 'moonstone');
  b.set(3, 6, 1, 'moonstone');
  b.box(-2, 2, 1, 2, 5, 1, 'air');
  // A crescent picked out above the arch.
  for (const [dx, dy] of [[-1, 7], [0, 8], [1, 8], [2, 7], [2, 9], [1, 10], [0, 10], [-1, 9]]) {
    b.set(dx, dy, 1, 'moonstone');
  }
  b.set(-4, 4, 1, 'lantern');
  b.set(4, 4, 1, 'lantern');
  b.set(-4, 1, 1, 'flower_pink');
  b.set(4, 1, 1, 'flower_pink');
}
