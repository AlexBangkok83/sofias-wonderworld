import * as THREE from 'three';
import * as tex from './textures.js';

// Block ids are written into save files. Never renumber an existing block —
// only append new ones at the end.
//
//   solid     -> the player collides with it
//   opaque    -> hides the neighbouring face (glass and plants do not)
//   geometry  -> 'box' for a normal cube, 'cross' for two crossed planes
//   glow      -> emits light; the renderer places a point light nearby
//   palette   -> shows up in Sofia's building hotbar

export const AIR = 0;

const DEFS = [
  {
    id: 1, key: 'oak', label: 'Wood',
    paint: tex.planks(0xb98a53, 21), palette: 'build', icon: '#b98a53',
  },
  {
    id: 2, key: 'darkwood', label: 'Dark Wood',
    paint: tex.planks(0x6b4a30, 22), palette: 'build', icon: '#6b4a30',
  },
  {
    id: 3, key: 'plaster', label: 'White Plaster',
    paint: tex.plaster(0xf1ece1, 23), palette: 'build', icon: '#f1ece1',
  },
  {
    id: 4, key: 'stone', label: 'Stone',
    paint: tex.cobble(0xa7a49b, 24), palette: 'build', icon: '#a7a49b',
  },
  {
    id: 5, key: 'glass', label: 'Glass',
    paint: tex.glassPane('#cfe9f5', 25), opaque: false, transparent: true,
    palette: 'build', icon: '#cfe9f5',
  },
  {
    id: 6, key: 'lantern', label: 'Lantern',
    paint: tex.lantern(26), glow: { color: 0xffcf85, intensity: 1.5, distance: 11 },
    palette: 'light', icon: '#ffd98a',
  },
  {
    id: 7, key: 'wool_pink', label: 'Pink Wool',
    paint: tex.wool(0xe89ab8, 27), palette: 'colour', icon: '#e89ab8',
  },
  {
    id: 8, key: 'wool_purple', label: 'Purple Wool',
    paint: tex.wool(0x9a7cc4, 28), palette: 'colour', icon: '#9a7cc4',
  },
  {
    id: 9, key: 'wool_mint', label: 'Mint Wool',
    paint: tex.wool(0x9ed6bd, 29), palette: 'colour', icon: '#9ed6bd',
  },
  {
    id: 10, key: 'wool_yellow', label: 'Yellow Wool',
    paint: tex.wool(0xf2d489, 30), palette: 'colour', icon: '#f2d489',
  },
  {
    id: 11, key: 'wool_blue', label: 'Blue Wool',
    paint: tex.wool(0x8fb6dd, 31), palette: 'colour', icon: '#8fb6dd',
  },
  {
    id: 12, key: 'wool_white', label: 'White Wool',
    paint: tex.wool(0xf5f2ec, 32), palette: 'colour', icon: '#f5f2ec',
  },
  {
    id: 13, key: 'leaves', label: 'Leaves',
    paint: tex.leaves(0x5e9450, 33), opaque: false, transparent: true,
    palette: 'garden', icon: '#5e9450',
  },
  {
    id: 14, key: 'flower_pink', label: 'Pink Flowers',
    paint: tex.flower('#f28fb0', 34), geometry: 'cross', solid: false,
    opaque: false, transparent: true, palette: 'garden', icon: '#f28fb0',
  },
  {
    id: 15, key: 'flower_yellow', label: 'Yellow Flowers',
    paint: tex.flower('#f7cf5e', 35), geometry: 'cross', solid: false,
    opaque: false, transparent: true, palette: 'garden', icon: '#f7cf5e',
  },
  {
    id: 16, key: 'rug', label: 'Rug',
    paint: tex.rug(0xc4646a, '#f0d9a0', 36), palette: 'build', icon: '#c4646a',
  },
  {
    id: 17, key: 'bookshelf', label: 'Bookshelf',
    paint: tex.bookshelf(37), palette: 'build', icon: '#8a6236',
  },
  // --- World blocks: used by the authored village, not in Sofia's palette ---
  {
    id: 18, key: 'grass', label: 'Grass',
    faces: {
      top: tex.grassTop(0x7cb262, 38),
      side: tex.grassSide(0x8a6b48, 0x7cb262, 39),
      bottom: tex.speckle(0x8a6b48, 0.12, 40),
    },
  },
  { id: 19, key: 'dirt', label: 'Dirt', paint: tex.speckle(0x8a6b48, 0.14, 41) },
  { id: 20, key: 'path', label: 'Path', paint: tex.pathStone(42) },
  {
    id: 21, key: 'water', label: 'Water',
    paint: tex.water(43), solid: false, opaque: false, transparent: true, opacity: 0.78,
  },
  { id: 22, key: 'log', label: 'Log', paint: tex.beam(0x7a5636, 44) },
  { id: 23, key: 'roof', label: 'Roof Slate', paint: tex.shingle(0x4b3a2f, 45), palette: 'build', icon: '#4b3a2f' },
  { id: 24, key: 'shutter', label: 'Purple Shutter', paint: tex.planks(0x8f76c0, 46), palette: 'build', icon: '#8f76c0' },
  {
    id: 25, key: 'vine', label: 'Hanging Vine',
    paint: tex.vine(0x5d8f4c, 47), geometry: 'cross', solid: false,
    opaque: false, transparent: true, palette: 'garden', icon: '#5d8f4c',
  },
  {
    id: 26, key: 'tuft', label: 'Tall Grass',
    paint: tex.tuft(0x77ad5d, 48), geometry: 'cross', solid: false,
    opaque: false, transparent: true, palette: 'garden', icon: '#77ad5d',
  },
  {
    id: 27, key: 'moonstone', label: 'Moonstone',
    paint: tex.moonstone(49), glow: { color: 0xd7d0f5, intensity: 0.9, distance: 13 },
    palette: 'light', icon: '#f2eef7',
  },
  { id: 28, key: 'ivy', label: 'Ivy', paint: tex.leaves(0x4a7d43, 50), opaque: false, transparent: true, palette: 'garden', icon: '#4a7d43' },
  {
    id: 29, key: 'fence', label: 'White Fence',
    paint: tex.planks(0xf3efe6, 51), geometry: 'post', opaque: false,
    palette: 'build', icon: '#f3efe6',
  },
  { id: 30, key: 'concrete', label: 'Concrete', paint: tex.plaster(0xb9b6ae, 52) },
  { id: 31, key: 'darkstone', label: 'Slate', paint: tex.cobble(0x6f6f74, 53) },
  { id: 32, key: 'sand', label: 'Sand', paint: tex.speckle(0xe3d3a8, 0.1, 54) },
];

/** id -> definition, with defaults applied. */
export const BLOCKS = new Map();
for (const def of DEFS) {
  BLOCKS.set(def.id, {
    solid: true,
    opaque: true,
    transparent: false,
    geometry: 'box',
    opacity: 1,
    palette: null,
    icon: '#cccccc',
    ...def,
  });
}

export const BY_KEY = new Map([...BLOCKS.values()].map((b) => [b.key, b]));

/** Look a block up by its short name — how the world builders refer to them. */
export function blockId(key) {
  const def = BY_KEY.get(key);
  if (!def) throw new Error(`Unknown block "${key}"`);
  return def.id;
}

export function isSolid(id) {
  if (id === AIR) return false;
  const def = BLOCKS.get(id);
  return def ? def.solid : false;
}

export function isOpaque(id) {
  if (id === AIR) return false;
  const def = BLOCKS.get(id);
  return def ? def.opaque : false;
}

export function getBlock(id) {
  return BLOCKS.get(id) || null;
}

/** Blocks Sofia can build with, grouped for the hotbar. */
export const PALETTE_GROUPS = [
  { key: 'build', label: 'Build' },
  { key: 'colour', label: 'Colours' },
  { key: 'garden', label: 'Garden' },
  { key: 'light', label: 'Lights' },
];

export function paletteBlocks() {
  const groups = new Map(PALETTE_GROUPS.map((g) => [g.key, []]));
  for (const def of BLOCKS.values()) {
    if (def.palette && groups.has(def.palette)) groups.get(def.palette).push(def);
  }
  return PALETTE_GROUPS.map((g) => ({ ...g, blocks: groups.get(g.key) }));
}

// --- Geometry + material construction (built lazily, once) ---

const BOX = new THREE.BoxGeometry(1, 1, 1);

/**
 * A box whose UVs are remapped into a 3-tile vertical atlas so top, sides and
 * bottom can differ while still using one material.
 */
function boxWithFaceAtlas() {
  const geo = BOX.clone();
  const uv = geo.attributes.uv;
  // BoxGeometry vertex order: +X, -X, +Y, -Y, +Z, -Z — four vertices each.
  // Atlas bands (top to bottom in image space): 0 = top, 1 = side, 2 = bottom.
  const bandForFace = [1, 1, 0, 2, 1, 1];
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    const band = bandForFace[face];
    const v = uv.getY(i);
    // Image row 0 is v = 1 in texture space, so bands count down from the top.
    uv.setY(i, (2 - band + v) / 3);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Fence: a slim post with rails running both ways, so a line of them reads as
 * a picket fence instead of a wall. She specifically picked a build with a
 * white picket fence, and full cubes here looked like a garden wall.
 */
function postGeometry() {
  const pieces = [];
  const add = (w, h, d, x, y, z) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(x, y, z);
    pieces.push(geo);
  };
  add(0.26, 1, 0.26, 0, 0, 0);              // post
  for (const y of [0.22, -0.18]) {          // rails, both directions
    add(1, 0.13, 0.1, 0, y, 0);
    add(0.1, 0.13, 1, 0, y, 0);
  }
  return mergeGeometries(pieces);
}

/** Two crossed vertical quads — how plants and vines are drawn. */
function crossGeometry() {
  const plane = new THREE.PlaneGeometry(1.36, 1);
  const a = plane.clone();
  a.rotateY(Math.PI / 4);
  const b = plane.clone();
  b.rotateY(-Math.PI / 4);
  const merged = mergeGeometries([a, b]);
  return merged;
}

/** Minimal position/normal/uv merge — avoids pulling in an addon just for this. */
function mergeGeometries(list) {
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  let offset = 0;
  for (const geo of list) {
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const t = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      position.push(p.getX(i), p.getY(i), p.getZ(i));
      normal.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(t.getX(i), t.getY(i));
    }
    const idx = geo.index;
    for (let i = 0; i < idx.count; i++) index.push(idx.getX(i) + offset);
    offset += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  return geo;
}

const cache = new Map();

/** Geometry + material for a block id, built on first use and shared after. */
export function getBlockRender(id) {
  if (cache.has(id)) return cache.get(id);
  const def = BLOCKS.get(id);
  if (!def) return null;

  let geometry;
  let map;
  if (def.geometry === 'cross') {
    geometry = crossGeometry();
    map = tex.makeTexture(def.paint);
  } else if (def.geometry === 'post') {
    geometry = postGeometry();
    map = tex.makeTexture(def.paint);
  } else if (def.faces) {
    geometry = boxWithFaceAtlas();
    map = tex.makeFaceAtlas(def.faces.top, def.faces.side, def.faces.bottom);
  } else {
    geometry = BOX.clone();
    map = tex.makeTexture(def.paint);
  }

  const material = new THREE.MeshLambertMaterial({
    map,
    transparent: def.transparent && def.opacity < 1,
    opacity: def.opacity,
    alphaTest: def.transparent && def.opacity >= 1 ? 0.35 : 0,
    side: def.geometry === 'cross' ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (def.glow) {
    material.emissive = new THREE.Color(def.glow.color);
    material.emissiveIntensity = 0.85;
    material.emissiveMap = map;
  }

  const entry = { def, geometry, material };
  cache.set(id, entry);
  return entry;
}
