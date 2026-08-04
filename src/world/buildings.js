// Exterior shells for the village. Each takes a Build already offset to the
// building's corner, where local y = 0 is the grass block it stands on.
//
// The cottage is the aesthetic north star Sofia picked: warm wood, white
// plaster, purple shutters, flower boxes, lanterns everywhere. The others are
// styled to sit next to it without stealing from it.

/** Sofia's favourite — white cottage, dark wood roof, ivy, purple shutters. */
export function cottage(b, { w = 14, d = 12 } = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, 'stone');            // footing
  b.box(1, 1, 1, w - 2, 1, d - 2, 'oak');              // floor line
  b.walls(0, 1, 0, w - 1, 5, d - 1, 'plaster');

  // Corner posts and a waist beam — the half-timbered look.
  for (const [x, z] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) {
    b.box(x, 1, z, x, 5, z, 'darkwood');
  }
  b.outline(0, 3, 0, w - 1, d - 1, 'darkwood');

  // Front door, facing +z.
  const doorX = Math.floor(w / 2) - 1;
  b.doorway(doorX, 1, d - 1, 'z', 2);
  b.box(doorX - 1, 3, d - 1, doorX + 2, 3, d - 1, 'darkwood');
  b.set(doorX - 1, 3, d - 1, 'lantern');
  b.set(doorX + 2, 3, d - 1, 'lantern');
  b.box(doorX, 0, d, doorX + 1, 0, d + 1, 'path');

  // Windows with purple shutters and flower boxes.
  b.window(2, 2, d - 1, 'z', { flowers: 'flower_pink' });
  b.window(w - 4, 2, d - 1, 'z', { flowers: 'flower_yellow' });
  b.window(0, 2, 3, 'x', { flowers: 'flower_pink' });
  b.window(0, 2, d - 5, 'x', { flowers: 'flower_yellow' });
  b.window(w - 1, 2, 3, 'x', { flowers: 'flower_yellow' });
  b.window(w - 1, 2, d - 5, 'x', { flowers: 'flower_pink' });

  // Dark wood gable roof with an eave trim.
  b.gable(0, 0, w - 1, d - 1, 6, 'roof', { axis: 'x', overhang: 1, trim: 'darkwood' });

  // Chimney.
  b.box(3, 6, 2, 4, 10, 3, 'stone');
  b.set(3, 11, 2, 'lantern');

  // Ivy creeping up the back and one side.
  for (let x = 2; x < w - 2; x += 3) b.box(x, 2, 0, x, 4, 0, 'ivy');
  for (let z = 2; z < d - 2; z += 4) b.box(0, 3, z, 0, 5, z, 'ivy');

  // White picket fence around the garden, with a gap at the path.
  b.fence(-4, -4, w + 3, d + 3, 1, 'fence', [[doorX, d + 3], [doorX + 1, d + 3]]);
  b.scatter(-3, -3, w + 2, d + 2, 1, { density: 0.16, seed: 11 });
  b.tree(-3, 1, d + 1, { height: 4, canopy: 2 });
  b.tree(w + 2, 1, -2, { height: 5, canopy: 2 });
  b.lampPosts([[doorX - 3, d + 3], [doorX + 4, d + 3]], 1, 3);
}

/** Two-storey stucco-and-stone modern house with an attached garage. */
export function modernHouse(b, { w = 18, d = 14 } = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, 'concrete');
  const mainW = w - 6;

  // Main block: two storeys, stucco over a stone base.
  b.walls(0, 1, 0, mainW - 1, 2, d - 1, 'darkstone');
  b.walls(0, 3, 0, mainW - 1, 8, d - 1, 'plaster');
  b.box(0, 9, 0, mainW - 1, 9, d - 1, 'darkstone');   // flat roof slab
  b.box(1, 10, 1, mainW - 2, 10, d - 2, 'concrete');  // roof terrace

  // Deep glazing bands on both storeys.
  b.box(2, 4, d - 1, mainW - 3, 6, d - 1, 'glass');
  b.box(2, 1, d - 1, 4, 2, d - 1, 'glass');
  b.box(0, 4, 3, 0, 6, d - 4, 'glass');

  const doorX = Math.floor(mainW / 2) - 1;
  b.doorway(doorX, 1, d - 1, 'z', 2);
  b.box(doorX - 1, 3, d - 1, doorX + 2, 3, d - 1, 'oak');
  b.set(doorX - 1, 2, d - 1, 'lantern');
  b.set(doorX + 2, 2, d - 1, 'lantern');
  b.box(doorX, 0, d, doorX + 1, 0, d + 2, 'path');

  // Attached garage: lower, wider door, flat roof.
  b.walls(mainW - 1, 1, 3, w - 1, 4, d - 1, 'concrete');
  b.box(mainW - 1, 5, 3, w - 1, 5, d - 1, 'darkstone');
  b.box(mainW + 1, 1, d - 1, w - 2, 3, d - 1, 'darkstone'); // roller door
  b.box(mainW, 0, d, w - 1, 0, d + 3, 'concrete');          // driveway
  b.set(mainW, 4, d - 1, 'lantern');
  b.set(w - 1, 4, d - 1, 'lantern');

  // Planting to keep it from reading cold.
  for (let x = 1; x < mainW - 1; x += 3) b.set(x, 1, d, 'leaves');
  b.tree(-3, 1, 4, { height: 6, canopy: 3 });
  b.scatter(-3, -3, w + 2, d + 3, 1, { density: 0.08, kinds: ['tuft'], seed: 12 });
}

/** The bakery: small, warm, chimney always going. */
export function bakery(b, { w = 13, d = 11 } = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, 'stone');
  b.walls(0, 1, 0, w - 1, 4, d - 1, 'plaster');
  b.outline(0, 1, 0, w - 1, d - 1, 'stone');
  for (const [x, z] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) {
    b.box(x, 1, z, x, 4, z, 'oak');
  }

  const doorX = Math.floor(w / 2) - 1;
  b.doorway(doorX, 1, d - 1, 'z', 2);
  b.set(doorX - 1, 3, d - 1, 'lantern');
  b.set(doorX + 2, 3, d - 1, 'lantern');
  b.box(doorX, 0, d, doorX + 1, 0, d + 1, 'path');

  b.window(2, 2, d - 1, 'z', { flowers: 'flower_yellow' });
  b.window(w - 4, 2, d - 1, 'z', { flowers: 'flower_yellow' });

  b.gable(0, 0, w - 1, d - 1, 5, 'roof', { axis: 'x', overhang: 1, trim: 'oak' });

  // Awning over the front, on posts.
  b.box(-1, 4, d, w, 4, d + 1, 'wool_pink');
  b.box(-1, 1, d + 1, -1, 3, d + 1, 'oak');
  b.box(w, 1, d + 1, w, 3, d + 1, 'oak');

  b.box(2, 5, 1, 3, 8, 2, 'stone');
  b.set(2, 9, 1, 'lantern');
  b.scatter(-2, -2, w + 1, d + 2, 1, { density: 0.14, seed: 13 });
}

/** The animal barn: big doors, hay loft, weather vane cupola. */
export function barn(b, { w = 15, d = 13 } = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, 'dirt');
  b.walls(0, 1, 0, w - 1, 6, d - 1, 'oak');
  b.outline(0, 1, 0, w - 1, d - 1, 'darkwood');
  b.outline(0, 6, 0, w - 1, d - 1, 'darkwood');
  // Cross-bracing on the long sides.
  for (let x = 2; x < w - 2; x += 4) b.box(x, 1, 0, x, 6, 0, 'darkwood');
  for (let x = 2; x < w - 2; x += 4) b.box(x, 1, d - 1, x, 6, d - 1, 'darkwood');

  const doorX = Math.floor(w / 2) - 1;
  b.doorway(doorX, 1, d - 1, 'z', 2);
  b.box(doorX - 1, 1, d - 1, doorX - 1, 3, d - 1, 'darkwood');
  b.box(doorX + 2, 1, d - 1, doorX + 2, 3, d - 1, 'darkwood');
  b.set(doorX - 1, 4, d - 1, 'lantern');
  b.set(doorX + 2, 4, d - 1, 'lantern');
  b.box(doorX, 0, d, doorX + 1, 0, d + 1, 'path');

  // Loft opening high on the front gable.
  b.box(doorX, 5, d - 1, doorX + 1, 6, d - 1, 'darkwood');

  b.gable(0, 0, w - 1, d - 1, 7, 'roof', { axis: 'x', overhang: 1, trim: 'darkwood' });
  // Cupola on the ridge.
  b.box(6, 11, 5, 8, 13, 7, 'oak');
  b.pyramid(6, 5, 8, 7, 14, 'roof', 0);
  b.set(7, 17, 6, 'lantern');

  // Paddock fence out front.
  b.fence(-6, d + 1, w + 5, d + 9, 1, 'fence', [[doorX, d + 1], [doorX + 1, d + 1]]);
  b.scatter(-5, d + 2, w + 4, d + 8, 1, { density: 0.2, kinds: ['tuft', 'flower_yellow'], seed: 14 });
}

/** The library: tall, symmetrical, a big arched window over the door. */
export function library(b, { w = 15, d = 13 } = {}) {
  b.box(0, 0, 0, w - 1, 0, d - 1, 'stone');
  b.walls(0, 1, 0, w - 1, 9, d - 1, 'plaster');
  b.outline(0, 1, 0, w - 1, d - 1, 'stone');
  b.outline(0, 2, 0, w - 1, d - 1, 'stone');
  for (const [x, z] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) {
    b.box(x, 1, z, x, 9, z, 'stone');
  }
  // Pilasters.
  for (let x = 3; x < w - 3; x += 4) b.box(x, 3, d - 1, x, 9, d - 1, 'stone');

  const doorX = Math.floor(w / 2) - 1;
  b.doorway(doorX, 1, d - 1, 'z', 2);
  b.box(doorX - 2, 3, d - 1, doorX + 3, 3, d - 1, 'stone');
  b.set(doorX - 2, 4, d - 1, 'lantern');
  b.set(doorX + 3, 4, d - 1, 'lantern');
  b.box(doorX, 0, d, doorX + 1, 0, d + 2, 'path');

  // Arched window above the entrance.
  b.box(doorX - 1, 4, d - 1, doorX + 2, 7, d - 1, 'glass');
  b.set(doorX - 1, 7, d - 1, 'stone');
  b.set(doorX + 2, 7, d - 1, 'stone');
  b.box(doorX, 8, d - 1, doorX + 1, 8, d - 1, 'glass');

  b.window(1, 4, 0, 'x', { width: 3, height: 3, shutters: false, flowers: null });
  b.box(0, 4, 3, 0, 6, 5, 'glass');
  b.box(0, 4, d - 6, 0, 6, d - 4, 'glass');
  b.box(w - 1, 4, 3, w - 1, 6, 5, 'glass');
  b.box(w - 1, 4, d - 6, w - 1, 6, d - 4, 'glass');

  b.gable(0, 0, w - 1, d - 1, 10, 'roof', { axis: 'x', overhang: 1, trim: 'stone' });

  // Steps up to the door.
  b.box(doorX - 2, 0, d + 1, doorX + 3, 0, d + 2, 'stone');
  b.tree(-3, 1, 3, { height: 5, canopy: 3 });
  b.tree(w + 2, 1, 3, { height: 5, canopy: 3 });
  b.scatter(-2, -2, w + 1, d + 3, 1, { density: 0.1, seed: 15 });
}
