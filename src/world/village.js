import { Build } from './builder.js';
import { cottage, modernHouse, bakery, barn, library } from './buildings.js';
import { buildMoonGate } from './moonhouse.js';

// The outdoor village. Authored and locked — Sofia's rule is that building
// happens inside houses only, so nothing out here can be edited.
//
// Open question still with her: what the buildings actually are, and whether
// the village has a name. These five are a starting set to react to.

export const GROUND = 8;          // y of the grass surface
export const VILLAGE_SIZE = [96, 32, 96];

/** Where each building sits, and where you land coming back out of its door. */
export const PLACEMENTS = {
  cottage: { origin: [10, GROUND, 12], size: [14, 12], interior: 'cottage_in' },
  modern: { origin: [58, GROUND, 10], size: [18, 14], interior: 'modern_in', mainW: 12 },
  bakery: { origin: [12, GROUND, 58], size: [13, 11], interior: 'bakery_in' },
  barn: { origin: [56, GROUND, 58], size: [15, 13], interior: 'barn_in' },
  library: { origin: [34, GROUND, 72], size: [15, 13], interior: 'library_in' },
};

export const MOON_GATE = [82, GROUND, 88];

/** Front-door coordinates derived from each placement, so they can't drift. */
function doorInfo(key) {
  const p = PLACEMENTS[key];
  const [ox, , oz] = p.origin;
  const w = p.mainW || p.size[0];
  const d = p.size[1];
  const doorX = ox + Math.floor(w / 2) - 1;
  const doorZ = oz + d - 1;
  return { doorX, doorZ };
}

export const VILLAGE_DOORS = Object.keys(PLACEMENTS).map((key) => {
  const { doorX, doorZ } = doorInfo(key);
  return {
    x0: doorX, x1: doorX + 1, z0: doorZ, z1: doorZ,
    target: PLACEMENTS[key].interior,
    label: PLACEMENTS[key].interior,
  };
});

VILLAGE_DOORS.push({
  x0: MOON_GATE[0] - 2, x1: MOON_GATE[0] + 2,
  z0: MOON_GATE[2], z1: MOON_GATE[2] + 2,
  target: 'moon_house',
  label: 'The Moon House',
  secret: true,
});

/** Named landing spots used when you come back outside. */
export const VILLAGE_SPAWNS = {};
for (const key of Object.keys(PLACEMENTS)) {
  const { doorX, doorZ } = doorInfo(key);
  VILLAGE_SPAWNS[key] = { pos: [doorX + 1, GROUND + 1, doorZ + 2.5], yaw: Math.PI };
}
VILLAGE_SPAWNS.moongate = {
  pos: [MOON_GATE[0] + 0.5, GROUND + 1, MOON_GATE[2] + 4.5],
  yaw: Math.PI,
};
VILLAGE_SPAWNS.start = { pos: [16.5, GROUND + 1, 31.5], yaw: 0 };

export function buildVillage(zone) {
  const b = new Build(zone);
  const [W, , D] = VILLAGE_SIZE;

  // ---- Terrain -------------------------------------------------------
  b.box(0, 0, 0, W - 1, GROUND - 3, D - 1, 'stone');
  b.box(0, GROUND - 2, 0, W - 1, GROUND - 1, D - 1, 'dirt');
  b.box(0, GROUND, 0, W - 1, GROUND, D - 1, 'grass');

  // ---- Paths: a cross through the plaza, spurs out to every door ------
  const path = (x0, z0, x1, z1) => b.box(x0, GROUND, z0, x1, GROUND, z1, 'path');
  path(46, 4, 49, D - 5);       // north–south
  path(4, 46, W - 5, 49);       // east–west
  path(42, 40, 54, 56);         // plaza apron

  path(16, 25, 17, 46);         // cottage spur
  path(63, 25, 64, 46);         // modern spur
  path(17, 49, 18, 69);         // bakery spur
  path(49, 70, 63, 71);         // barn spur
  path(62, 71, 63, 71);
  path(40, 50, 41, 85);         // library spur
  path(40, 86, 70, 87);         // the way east, toward the grove
  path(74, 86, 75, 92);         // and on to the moon gate
  path(75, 91, 84, 92);

  // ---- Plaza pond ----------------------------------------------------
  b.box(44, GROUND - 2, 44, 52, GROUND, 52, 'dirt');
  b.box(45, GROUND - 1, 45, 51, GROUND, 51, 'water');
  b.outline(44, GROUND, 44, 52, 52, 'stone');
  b.set(48, GROUND + 1, 48, 'moonstone');
  b.lampPosts([[43, 43], [53, 43], [43, 53], [53, 53]], GROUND + 1, 3);
  b.scatter(40, 38, 56, 58, GROUND + 1, { density: 0.09, seed: 21 });

  // ---- Buildings -----------------------------------------------------
  cottage(b.at(...PLACEMENTS.cottage.origin), { w: 14, d: 12 });
  modernHouse(b.at(...PLACEMENTS.modern.origin), { w: 18, d: 14 });
  bakery(b.at(...PLACEMENTS.bakery.origin), { w: 13, d: 11 });
  barn(b.at(...PLACEMENTS.barn.origin), { w: 15, d: 13 });
  library(b.at(...PLACEMENTS.library.origin), { w: 15, d: 13 });

  // ---- The hidden grove ----------------------------------------------
  // A hedge ring with one gap in it. The moon house is meant to be found,
  // so nothing signposts this except a line of lanterns along the path.
  const hedge = (x0, z0, x1, z1) => {
    for (let x = x0; x <= x1; x++) {
      for (const z of [z0, z1]) b.box(x, GROUND + 1, z, x, GROUND + 3, z, 'leaves');
    }
    for (let z = z0; z <= z1; z++) {
      for (const x of [x0, x1]) b.box(x, GROUND + 1, z, x, GROUND + 3, z, 'leaves');
    }
  };
  hedge(70, 78, 93, 93);
  // The one way in, lined up with the path that arrives from the village.
  b.box(70, GROUND + 1, 86, 70, GROUND + 3, 87, 'air');
  b.box(70, GROUND, 86, 74, GROUND, 87, 'path');

  buildMoonGate(b, ...MOON_GATE);
  b.box(MOON_GATE[0] - 2, GROUND, MOON_GATE[2] + 1, MOON_GATE[0] + 2, GROUND, MOON_GATE[2] + 6, 'path');
  b.lampPosts([[76, 84], [88, 84], [76, 91], [88, 91]], GROUND + 1, 3);
  b.scatter(72, 80, 91, 92, GROUND + 1, {
    density: 0.22, kinds: ['flower_pink', 'tuft', 'flower_yellow'], seed: 22,
  });
  for (const [x, z] of [[74, 82], [90, 82], [74, 90], [90, 90]]) {
    b.tree(x, GROUND + 1, z, { height: 6, canopy: 3 });
  }

  // ---- Trees, meadow and shoreline ------------------------------------
  const treeSpots = [
    [6, 6], [30, 8], [40, 14], [52, 8], [86, 12], [90, 30], [6, 34], [28, 34],
    [38, 30], [56, 34], [78, 40], [8, 46], [88, 52], [30, 52], [6, 70], [28, 76],
    [52, 62], [78, 62], [86, 68], [10, 86], [24, 88], [58, 88], [66, 44], [34, 62],
  ];
  for (const [x, z] of treeSpots) {
    b.tree(x, GROUND + 1, z, { height: 4 + ((x + z) % 3), canopy: 2 + ((x * z) % 2) });
  }

  b.scatter(2, 2, W - 3, D - 3, GROUND + 1, {
    density: 0.06, kinds: ['tuft', 'flower_pink', 'flower_yellow'], seed: 23,
  });

  // Lanterns down the two main paths so the village stays warm at dusk.
  const posts = [];
  for (let z = 12; z < D - 10; z += 12) { posts.push([44, z]); posts.push([51, z]); }
  for (let x = 12; x < W - 10; x += 12) { posts.push([x, 44]); posts.push([x, 51]); }
  b.lampPosts(posts.filter(([x, z]) => zone.get(x, GROUND + 1, z) === 0), GROUND + 1, 3);

  // A low stone wall around the village edge so the world has an edge you
  // can see rather than an invisible one you bump into.
  b.walls(1, GROUND + 1, 1, W - 2, GROUND + 2, D - 2, 'stone');
  // Openings would let her walk out of the world, so the wall stays closed;
  // it's dressed with ivy and flowers instead of feeling like a barrier.
  for (let x = 3; x < W - 3; x += 5) {
    b.set(x, GROUND + 3, 1, 'ivy');
    b.set(x, GROUND + 3, D - 2, 'ivy');
  }
  for (let z = 3; z < D - 3; z += 5) {
    b.set(1, GROUND + 3, z, 'ivy');
    b.set(W - 2, GROUND + 3, z, 'ivy');
  }
}

/** Villagers who stand outside rather than in a building. */
export const VILLAGE_NPCS = [
  { id: 'tomas', x: 48.5, z: 40.5, yaw: Math.PI },
  { id: 'wren', x: 20.5, z: 47.5, yaw: -Math.PI / 2 },
];
