import { Build } from './builder.js';

// Interior rooms. Every one of these is editable — Sofia's rule is that
// building happens inside houses only, so the outdoor village is authored and
// locked while all of this is hers to change.
//
// Rooms are deliberately under-furnished. She wants to make her own furniture
// out of blocks, so the job here is to give her a warm, well-lit empty stage:
// good floor, good light, a few anchor pieces, and lots of open space.

/** Standard room shell: floor, walls, ceiling beams, corner posts. */
function shell(b, w, h, d, {
  floor = 'oak',
  wall = 'plaster',
  beam = 'darkwood',
  ceiling = 'plaster',
  post = true,
} = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, floor);
  b.walls(0, 1, 0, w - 1, h - 1, d - 1, wall);
  b.box(0, h, 0, w - 1, h, d - 1, ceiling);
  // Exposed ceiling beams running across the short axis.
  for (let x = 2; x < w - 1; x += 4) b.box(x, h - 1, 1, x, h - 1, d - 2, beam);
  if (post) {
    for (const [x, z] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) {
      b.box(x, 1, z, x, h - 1, z, beam);
    }
  }
  // Skirting board.
  b.outline(0, 1, 0, w - 1, d - 1, beam);
}

/** Door hole in a wall plus a warm lantern either side of it. */
function entrance(b, x, z, facing, lanternY = 3) {
  b.doorway(x, 1, z, facing, 2);
  if (facing === 'z') {
    b.set(x - 1, lanternY, z, 'lantern');
    b.set(x + 2, lanternY, z, 'lantern');
  } else {
    b.set(x, lanternY, z - 1, 'lantern');
    b.set(x, lanternY, z + 2, 'lantern');
  }
}

export const INTERIORS = [
  // ------------------------------------------------------------------
  // The cottage — her favourite of the three Pinterest builds, and the
  // room Phase 1 ships with. Warm lanterns, wood and white plaster.
  // ------------------------------------------------------------------
  {
    id: 'cottage_in',
    label: 'The Cottage',
    size: [20, 14, 18],
    editable: true,
    indoor: true,
    spawn: [9.5, 1, 15.5],
    spawnYaw: 0,
    ambient: { sky: 0xffe0b4, ground: 0x8a6446, hemi: 1.7, sun: 0.5, fog: 0x4d3a33 },
    build(zone) {
      const b = new Build(zone);
      shell(b, 20, 9, 18);
      entrance(b, 9, 17, 'z');

      // Windows: two on each long wall, one on the back — purple shutters and
      // flower boxes, straight off the cottage reference.
      b.window(4, 3, 0, 'z', { flowers: 'flower_pink' });
      b.window(14, 3, 0, 'z', { flowers: 'flower_yellow' });
      b.window(0, 3, 5, 'x', { flowers: 'flower_pink' });
      b.window(0, 3, 12, 'x', { flowers: 'flower_yellow' });
      b.window(19, 3, 5, 'x', { flowers: 'flower_yellow' });
      b.window(19, 3, 12, 'x', { flowers: 'flower_pink' });

      // Hearth on the back wall.
      b.box(8, 1, 1, 11, 4, 1, 'stone');
      b.box(9, 1, 1, 10, 2, 1, 'lantern');
      b.box(8, 5, 1, 11, 5, 1, 'darkwood');

      // A rug set into the floor, and a reading corner.
      b.box(7, 0, 7, 12, 0, 11, 'rug');
      b.box(1, 1, 2, 1, 3, 4, 'bookshelf');
      b.box(18, 1, 2, 18, 3, 4, 'bookshelf');

      // Hanging lanterns from the beams.
      for (const [x, z] of [[5, 5], [14, 5], [5, 13], [14, 13]]) {
        b.set(x, 7, z, 'lantern');
      }

      // Loft over the back third, with four blocks of headroom above it and a
      // block staircase climbing towards it rather than away.
      b.box(1, 4, 1, 18, 4, 5, 'oak');
      b.box(6, 4, 2, 11, 4, 4, 'rug');
      b.outline(1, 5, 1, 18, 5, 'fence');
      b.box(15, 5, 5, 18, 5, 5, 'air');            // gap where the stairs arrive
      for (let i = 0; i < 4; i++) b.box(16, 1 + i, 9 - i, 18, 1 + i, 9 - i, 'oak');
      b.set(4, 8, 3, 'lantern');
      b.set(15, 8, 3, 'lantern');
    },
    doors: [
      { x0: 8, x1: 10, z0: 16, z1: 17, target: 'village', spawnKey: 'cottage', label: 'Outside' },
    ],
    npcs: [
      { id: 'mila', x: 4.5, z: 9.5, yaw: 1.2 },
    ],
  },

  // ------------------------------------------------------------------
  // The modern house — stucco, stone and a garage, from her second pick.
  // ------------------------------------------------------------------
  {
    id: 'modern_in',
    label: 'The Modern House',
    size: [22, 14, 18],
    editable: true,
    indoor: true,
    spawn: [10.5, 1, 15.5],
    spawnYaw: 0,
    ambient: { sky: 0xf2e6d8, ground: 0x8d8079, hemi: 1.8, sun: 0.6, fog: 0x4b4249 },
    build(zone) {
      const b = new Build(zone);
      shell(b, 22, 11, 18, { floor: 'concrete', wall: 'plaster', beam: 'darkstone', ceiling: 'plaster' });
      entrance(b, 10, 17, 'z');

      // Big modern glazing — a whole wall of glass onto the garden.
      b.box(2, 2, 0, 8, 5, 0, 'glass');
      b.box(13, 2, 0, 19, 5, 0, 'glass');
      b.box(0, 2, 4, 0, 5, 13, 'glass');

      // Open-plan split: a low stone divider instead of a wall.
      b.box(11, 1, 3, 11, 2, 12, 'stone');
      b.box(11, 3, 3, 11, 3, 12, 'oak');

      // Staircase up to a mezzanine over the right half.
      b.box(12, 5, 1, 20, 5, 8, 'oak');
      for (let i = 0; i < 5; i++) b.box(18, 1 + i, 13 - i, 20, 1 + i, 13 - i, 'concrete');
      b.outline(12, 6, 1, 20, 8, 'glass');
      b.box(18, 6, 8, 20, 6, 8, 'air');            // gap where the stairs arrive

      b.box(2, 0, 2, 5, 0, 6, 'rug');
      for (const [x, z] of [[3, 4], [17, 4], [3, 14], [17, 14], [8, 9]]) b.set(x, 9, z, 'lantern');
      for (const [x, z] of [[14, 3], [19, 6]]) b.set(x, 6, z, 'lantern');
    },
    doors: [
      { x0: 9, x1: 11, z0: 16, z1: 17, target: 'village', spawnKey: 'modern', label: 'Outside' },
    ],
    npcs: [
      { id: 'oskar', x: 16.5, z: 12.5, yaw: -1.8 },
    ],
  },

  // ------------------------------------------------------------------
  // The bakery — the warmest room in the village.
  // ------------------------------------------------------------------
  {
    id: 'bakery_in',
    label: 'The Bakery',
    size: [18, 12, 16],
    editable: true,
    indoor: true,
    spawn: [8.5, 1, 13.5],
    spawnYaw: 0,
    ambient: { sky: 0xffdcae, ground: 0x8f6446, hemi: 1.8, sun: 0.5, fog: 0x51372a },
    build(zone) {
      const b = new Build(zone);
      shell(b, 18, 7, 16, { floor: 'stone', wall: 'plaster', beam: 'oak' });
      entrance(b, 8, 15, 'z');

      b.window(3, 3, 0, 'z', { flowers: 'flower_yellow' });
      b.window(13, 3, 0, 'z', { flowers: 'flower_pink' });

      // Brick oven on the back wall, glowing.
      b.box(6, 1, 1, 11, 4, 2, 'stone');
      b.box(8, 1, 1, 9, 2, 1, 'lantern');
      b.box(6, 5, 1, 11, 5, 2, 'darkwood');

      // Counter running along the front.
      b.box(2, 1, 11, 15, 1, 11, 'oak');
      b.box(2, 2, 11, 15, 2, 11, 'darkwood');
      for (let x = 3; x <= 14; x += 4) b.set(x, 3, 11, 'lantern');

      // Shelves of loaves (bookshelf texture doubles nicely for stacked bread).
      b.box(1, 1, 3, 1, 4, 8, 'bookshelf');
      b.box(16, 1, 3, 16, 4, 8, 'bookshelf');
      b.box(5, 0, 6, 10, 0, 9, 'rug');
    },
    doors: [
      { x0: 7, x1: 9, z0: 14, z1: 15, target: 'village', spawnKey: 'bakery', label: 'Outside' },
    ],
    npcs: [
      { id: 'bruno', x: 8.5, z: 9.5, yaw: 0 },
    ],
  },

  // ------------------------------------------------------------------
  // The animal barn.
  // ------------------------------------------------------------------
  {
    id: 'barn_in',
    label: 'The Animal Barn',
    size: [20, 14, 18],
    editable: true,
    indoor: true,
    spawn: [9.5, 1, 15.5],
    spawnYaw: 0,
    ambient: { sky: 0xffe2b6, ground: 0x8a6b44, hemi: 1.7, sun: 0.55, fog: 0x4d3c28 },
    build(zone) {
      const b = new Build(zone);
      shell(b, 20, 11, 18, { floor: 'dirt', wall: 'oak', beam: 'darkwood', ceiling: 'oak' });
      entrance(b, 9, 17, 'z');

      // Stalls down both sides, open at the front.
      for (const z of [3, 7, 11]) {
        b.box(1, 1, z, 6, 3, z, 'darkwood');
        b.box(13, 1, z, 18, 3, z, 'darkwood');
      }
      b.box(1, 0, 1, 6, 0, 12, 'sand');
      b.box(13, 0, 1, 18, 0, 12, 'sand');

      // Hay loft under the roof, with the stairs climbing up to meet it.
      b.box(1, 5, 1, 18, 5, 6, 'oak');
      b.box(2, 6, 2, 6, 6, 5, 'wool_yellow');
      b.outline(1, 6, 1, 18, 6, 'fence');
      b.box(15, 6, 6, 18, 6, 6, 'air');
      for (let i = 0; i < 5; i++) b.box(16, 1 + i, 11 - i, 18, 1 + i, 11 - i, 'oak');

      for (const [x, z] of [[4, 15], [15, 15], [9, 8]]) b.set(x, 9, z, 'lantern');
      for (const [x, z] of [[9, 3], [12, 5]]) b.set(x, 4, z, 'lantern');
      b.window(0, 3, 14, 'x', { flowers: null, shutters: false });
      b.window(19, 3, 14, 'x', { flowers: null, shutters: false });
    },
    doors: [
      { x0: 8, x1: 10, z0: 16, z1: 17, target: 'village', spawnKey: 'barn', label: 'Outside' },
    ],
    npcs: [
      { id: 'poppy', x: 14.5, z: 13.5, yaw: -2.2 },
    ],
  },

  // ------------------------------------------------------------------
  // The library — quiet, tall, full of books.
  // ------------------------------------------------------------------
  {
    id: 'library_in',
    label: 'The Library',
    size: [20, 16, 20],
    editable: true,
    indoor: true,
    spawn: [9.5, 1, 17.5],
    spawnYaw: 0,
    ambient: { sky: 0xf6e2c4, ground: 0x6f5a4a, hemi: 1.6, sun: 0.5, fog: 0x453a41 },
    build(zone) {
      const b = new Build(zone);
      shell(b, 20, 10, 20, { floor: 'darkwood', wall: 'plaster', beam: 'darkwood' });
      entrance(b, 9, 19, 'z');

      // Two storeys of shelving around the walls.
      for (const y of [1, 6]) {
        b.box(1, y, 1, 18, y + 3, 1, 'bookshelf');
        b.box(1, y, 1, 1, y + 3, 12, 'bookshelf');
        b.box(18, y, 1, 18, y + 3, 12, 'bookshelf');
      }
      // Balcony walkway running round three sides, railed on the open edge.
      b.box(1, 5, 1, 18, 5, 4, 'oak');
      b.box(1, 5, 1, 4, 5, 14, 'oak');
      b.box(15, 5, 1, 18, 5, 14, 'oak');
      b.box(5, 6, 4, 14, 6, 4, 'fence');          // rail across the front
      b.box(4, 6, 5, 4, 6, 14, 'fence');          // rail down the left
      b.box(15, 6, 5, 15, 6, 14, 'fence');        // rail down the right

      // Stairs climbing up to meet the balcony at exactly its height.
      for (let i = 0; i < 5; i++) b.box(16, 1 + i, 18 - i, 18, 1 + i, 18 - i, 'oak');

      // Reading nook: rug, lanterns, tall window.
      b.box(7, 0, 8, 12, 0, 13, 'rug');
      b.box(8, 4, 0, 11, 8, 0, 'glass');
      for (const [x, z] of [[6, 7], [13, 7], [6, 16], [13, 16]]) b.set(x, 9, z, 'lantern');
      for (const [x, z] of [[2, 6], [17, 6], [2, 12], [17, 12]]) b.set(x, 9, z, 'lantern');
    },
    doors: [
      { x0: 8, x1: 10, z0: 18, z1: 19, target: 'village', spawnKey: 'library', label: 'Outside' },
    ],
    npcs: [
      { id: 'nell', x: 5.5, z: 11.5, yaw: 1.0 },
    ],
  },
];
