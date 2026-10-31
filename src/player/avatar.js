import * as THREE from 'three';
import { getClothNoise } from '../world/textures.js';
import { isUnlocked } from '../shop/packs.js';

// Blocky characters, Minecraft proportions. Everything is boxes — no models to
// load, and it means the character creator can rebuild an avatar instantly.
//
// Entries with a `pack` only appear in the character creator once she's
// bought that pack in the shop (src/shop/packs.js).

export const SKIN_TONES = [
  { id: 'porcelain', color: 0xf6ddc9 },
  { id: 'light', color: 0xf0c9a4 },
  { id: 'warm', color: 0xdfa878 },
  { id: 'tan', color: 0xc08858 },
  { id: 'olive', color: 0x9c6b43 },
  { id: 'brown', color: 0x74492c },
  { id: 'deep', color: 0x4f3020 },
  { id: 'mint', color: 0xbfe3cf },
  { id: 'lilac', color: 0xdcc9ef },
];

export const HAIR_COLORS = [
  { id: 'black', color: 0x241d1c },
  { id: 'brown', color: 0x5a3a24 },
  { id: 'chestnut', color: 0x8a5230 },
  { id: 'ginger', color: 0xc4653a },
  { id: 'blonde', color: 0xe3c274 },
  { id: 'platinum', color: 0xefe4c8 },
  { id: 'pink', color: 0xe98cb4 },
  { id: 'purple', color: 0x9a72c8 },
  { id: 'blue', color: 0x6f9fd8 },
  { id: 'mint', color: 0x8fd8bb },
  { id: 'cherry', color: 0xb8343a, pack: 'salon' },
  { id: 'teal', color: 0x3fa7a3, pack: 'salon' },
  { id: 'silver', color: 0xc9ccd6, pack: 'salon' },
];

export const CLOTH_COLORS = [
  { id: 'rose', color: 0xe08aa4 },
  { id: 'red', color: 0xc4514f },
  { id: 'orange', color: 0xe2934e },
  { id: 'yellow', color: 0xefcd6e },
  { id: 'green', color: 0x76b46a },
  { id: 'mint', color: 0x9ad9c0 },
  { id: 'teal', color: 0x4f9d9d },
  { id: 'blue', color: 0x6d9ad6 },
  { id: 'navy', color: 0x3c4d78 },
  { id: 'purple', color: 0x9a7cc4 },
  { id: 'lilac', color: 0xc3aee2 },
  { id: 'brown', color: 0x8a6440 },
  { id: 'cream', color: 0xf1e6d2 },
  { id: 'white', color: 0xf7f4ee },
  { id: 'grey', color: 0x9a9a9f },
  { id: 'black', color: 0x35323a },
];

export const HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'bob', label: 'Bob' },
  { id: 'long', label: 'Long' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'buns', label: 'Space Buns' },
  { id: 'braids', label: 'Braids' },
  { id: 'curly', label: 'Curly' },
  { id: 'bald', label: 'None' },
  { id: 'pigtails', label: 'Pigtails', pack: 'salon' },
  { id: 'mohawk', label: 'Mohawk', pack: 'salon' },
  { id: 'puff', label: 'Big Puff', pack: 'salon' },
];

export const ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Crown' },
  { id: 'flower', label: 'Flower' },
  { id: 'bow', label: 'Bow' },
  { id: 'ears', label: 'Cat Ears' },
  { id: 'hat', label: 'Pointy Hat' },
  { id: 'halo', label: 'Star' },
  { id: 'bunny', label: 'Bunny Ears', pack: 'animals' },
  { id: 'bear', label: 'Bear Ears', pack: 'animals' },
  { id: 'unicorn', label: 'Unicorn Horn', pack: 'animals' },
  { id: 'hearts', label: 'Heart Glasses', pack: 'rainbow' },
  { id: 'antennae', label: 'Antennae', pack: 'space' },
  { id: 'tiara', label: 'Tiara', pack: 'castle' },
];

/** The entries of one of the lists above that she has unlocked. */
export function unlockedOptions(list, owned = new Set()) {
  return list.filter((entry) => isUnlocked(entry, owned));
}

/** Every hairstyle, hair colour and extra that comes in a given pack. */
export function packLooks(packId) {
  return [
    ...HAIR_STYLES.filter((e) => e.pack === packId).map((e) => ({ ...e, kind: 'Hairstyle' })),
    ...HAIR_COLORS.filter((e) => e.pack === packId).map((e) => ({ ...e, kind: 'Hair colour' })),
    ...ACCESSORIES.filter((e) => e.pack === packId).map((e) => ({ ...e, kind: 'Extra' })),
  ];
}

export const BODY_TYPES = [
  { id: 'small', label: 'Small', scale: 0.78 },
  { id: 'medium', label: 'Medium', scale: 0.9 },
  { id: 'tall', label: 'Tall', scale: 1.0 },
];

export const DEFAULT_CHARACTER = {
  name: 'Sofia',
  body: 'medium',
  skin: 'light',
  hair: 'long',
  hairColor: 'chestnut',
  shirt: 'lilac',
  pants: 'navy',
  shoes: 'brown',
  accessory: 'flower',
  accessoryColor: 'pink',
};

function lookup(list, id, fallbackIndex = 0) {
  return list.find((entry) => entry.id === id) || list[fallbackIndex];
}

export function characterScale(config) {
  return lookup(BODY_TYPES, config.body, 1).scale;
}

/** Height in world blocks — used for the camera and for name tag placement. */
export function characterHeight(config) {
  return 2.0 * characterScale(config);
}

const materialCache = new Map();
function material(color) {
  const key = color;
  if (materialCache.has(key)) return materialCache.get(key);
  const mat = new THREE.MeshLambertMaterial({
    color,
    map: getClothNoise(),
  });
  materialCache.set(key, mat);
  return mat;
}

const geometryCache = new Map();
function boxGeometry(w, h, d) {
  const key = `${w},${h},${d}`;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const geo = new THREE.BoxGeometry(w, h, d);
  geometryCache.set(key, geo);
  return geo;
}

function part(w, h, d, color, { x = 0, y = 0, z = 0 } = {}) {
  const mesh = new THREE.Mesh(boxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildHair(group, style, color, headTop, headY) {
  const c = color;
  const add = (w, h, d, x, y, z, tint = c) => group.add(part(w, h, d, tint, { x, y, z }));
  if (style === 'bald') return;

  // Cap over the crown, on every style.
  add(0.54, 0.14, 0.54, 0, headTop - 0.05, 0);
  add(0.54, 0.2, 0.1, 0, headY + 0.1, -0.23);          // back of the head

  switch (style) {
    case 'short':
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);     // fringe
      break;
    case 'bob':
      add(0.58, 0.34, 0.1, 0, headY - 0.02, -0.25);
      add(0.1, 0.36, 0.5, -0.25, headY - 0.02, -0.02);
      add(0.1, 0.36, 0.5, 0.25, headY - 0.02, -0.02);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'long':
      add(0.56, 0.8, 0.12, 0, headY - 0.3, -0.27);
      add(0.1, 0.5, 0.5, -0.25, headY - 0.1, -0.02);
      add(0.1, 0.5, 0.5, 0.25, headY - 0.1, -0.02);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'ponytail':
      add(0.2, 0.62, 0.16, 0, headY - 0.28, -0.32);
      add(0.28, 0.16, 0.16, 0, headY + 0.08, -0.3);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'buns':
      add(0.22, 0.22, 0.22, -0.3, headTop + 0.02, 0);
      add(0.22, 0.22, 0.22, 0.3, headTop + 0.02, 0);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'braids':
      add(0.14, 0.66, 0.14, -0.29, headY - 0.24, -0.04);
      add(0.14, 0.66, 0.14, 0.29, headY - 0.24, -0.04);
      add(0.16, 0.1, 0.16, -0.29, headY - 0.58, -0.04);
      add(0.16, 0.1, 0.16, 0.29, headY - 0.58, -0.04);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'pigtails':
      add(0.18, 0.34, 0.18, -0.35, headY - 0.04, -0.06);
      add(0.18, 0.34, 0.18, 0.35, headY - 0.04, -0.06);
      add(0.1, 0.08, 0.1, -0.29, headY + 0.1, -0.06, 0xe98cb4);
      add(0.1, 0.08, 0.1, 0.29, headY + 0.1, -0.06, 0xe98cb4);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'mohawk':
      add(0.14, 0.24, 0.56, 0, headTop + 0.1, -0.02);
      add(0.14, 0.12, 0.12, 0, headTop + 0.02, 0.26);
      break;
    case 'puff':
      add(0.72, 0.34, 0.56, 0, headTop + 0.08, -0.06);
      add(0.12, 0.42, 0.5, -0.31, headY + 0.04, -0.06);
      add(0.12, 0.42, 0.5, 0.31, headY + 0.04, -0.06);
      add(0.64, 0.52, 0.14, 0, headY, -0.3);
      add(0.54, 0.12, 0.12, 0, headY + 0.16, 0.22);
      break;
    case 'curly':
      for (const [dx, dy, dz] of [
        [-0.24, 0.1, 0.2], [0.24, 0.1, 0.2], [-0.28, 0.04, -0.16], [0.28, 0.04, -0.16],
        [0, 0.14, -0.28], [-0.16, 0.16, 0.26], [0.16, 0.16, 0.26],
      ]) {
        add(0.22, 0.22, 0.22, dx, headY + dy, dz);
      }
      break;
    default:
      break;
  }
}

function buildAccessory(group, kind, color, headTop) {
  const add = (w, h, d, x, y, z, c = color) => group.add(part(w, h, d, c, { x, y, z }));
  switch (kind) {
    case 'crown':
      add(0.56, 0.1, 0.56, 0, headTop + 0.05, 0);
      for (const dx of [-0.2, 0, 0.2]) add(0.1, 0.12, 0.1, dx, headTop + 0.16, 0.2);
      for (const dx of [-0.2, 0, 0.2]) add(0.1, 0.12, 0.1, dx, headTop + 0.16, -0.2);
      break;
    case 'flower':
      add(0.16, 0.16, 0.16, 0.26, headTop - 0.02, 0.14);
      add(0.08, 0.08, 0.08, 0.26, headTop + 0.06, 0.22, 0xf7e07a);
      add(0.06, 0.14, 0.06, 0.26, headTop - 0.12, 0.14, 0x4f8a45);
      break;
    case 'bow':
      add(0.14, 0.14, 0.12, -0.18, headTop + 0.04, 0.1);
      add(0.14, 0.14, 0.12, 0.18, headTop + 0.04, 0.1);
      add(0.12, 0.1, 0.12, 0, headTop + 0.04, 0.1);
      break;
    case 'ears':
      add(0.14, 0.18, 0.1, -0.18, headTop + 0.08, -0.02);
      add(0.14, 0.18, 0.1, 0.18, headTop + 0.08, -0.02);
      add(0.07, 0.09, 0.06, -0.18, headTop + 0.07, 0.03, 0xf0a8bd);
      add(0.07, 0.09, 0.06, 0.18, headTop + 0.07, 0.03, 0xf0a8bd);
      break;
    case 'hat':
      add(0.72, 0.08, 0.72, 0, headTop + 0.02, 0);
      add(0.42, 0.16, 0.42, 0, headTop + 0.14, 0);
      add(0.28, 0.16, 0.28, 0, headTop + 0.28, 0);
      add(0.14, 0.16, 0.14, 0, headTop + 0.42, 0);
      add(0.08, 0.08, 0.08, 0, headTop + 0.54, 0, 0xf7e07a);
      break;
    case 'halo':
      add(0.12, 0.12, 0.12, 0, headTop + 0.34, 0, 0xf7e07a);
      add(0.24, 0.05, 0.05, 0, headTop + 0.34, 0, 0xf7e07a);
      add(0.05, 0.24, 0.05, 0, headTop + 0.34, 0, 0xf7e07a);
      add(0.05, 0.05, 0.05, 0, headTop + 0.2, 0, 0xf7e07a);
      break;
    case 'bunny':
      for (const dx of [-0.12, 0.12]) {
        add(0.11, 0.4, 0.08, dx, headTop + 0.2, -0.04);
        add(0.05, 0.28, 0.02, dx, headTop + 0.2, 0.01, 0xf0a8bd);
      }
      break;
    case 'bear':
      for (const dx of [-0.21, 0.21]) {
        add(0.16, 0.15, 0.1, dx, headTop + 0.06, -0.02);
        add(0.08, 0.08, 0.02, dx, headTop + 0.05, 0.04, 0x5d3f28);
      }
      break;
    case 'unicorn':
      add(0.12, 0.1, 0.12, 0, headTop + 0.03, 0.17);
      add(0.09, 0.1, 0.09, 0, headTop + 0.12, 0.18);
      add(0.06, 0.1, 0.06, 0, headTop + 0.21, 0.19);
      add(0.03, 0.08, 0.03, 0, headTop + 0.29, 0.2);
      break;
    case 'hearts': {
      // Over the eyes, which sit just above the middle of the face.
      const eyeY = headTop - 0.2;
      const z = 0.27;
      for (const dx of [-0.12, 0.12]) {
        add(0.07, 0.07, 0.03, dx - 0.035, eyeY + 0.03, z);
        add(0.07, 0.07, 0.03, dx + 0.035, eyeY + 0.03, z);
        add(0.12, 0.05, 0.03, dx, eyeY - 0.02, z);
        add(0.05, 0.04, 0.03, dx, eyeY - 0.06, z);
      }
      add(0.06, 0.03, 0.03, 0, eyeY + 0.02, z, 0x35323a);
      add(0.03, 0.03, 0.26, -0.255, eyeY + 0.03, 0.14, 0x35323a);
      add(0.03, 0.03, 0.26, 0.255, eyeY + 0.03, 0.14, 0x35323a);
      break;
    }
    case 'antennae':
      for (const dx of [-0.13, 0.13]) {
        add(0.04, 0.3, 0.04, dx, headTop + 0.15, 0, 0x35323a);
        add(0.11, 0.11, 0.11, dx, headTop + 0.34, 0);
      }
      break;
    case 'tiara':
      add(0.52, 0.05, 0.06, 0, headTop + 0.04, 0.2, 0xf0c05a);
      add(0.08, 0.12, 0.04, 0, headTop + 0.12, 0.21, 0xf0c05a);
      add(0.05, 0.07, 0.04, -0.13, headTop + 0.09, 0.21, 0xf0c05a);
      add(0.05, 0.07, 0.04, 0.13, headTop + 0.09, 0.21, 0xf0c05a);
      add(0.05, 0.05, 0.03, 0, headTop + 0.12, 0.235);
      break;
    default:
      break;
  }
}

/**
 * Build an avatar. Returns a group whose origin is at the character's feet,
 * with limb pivots exposed so the walk cycle can swing them.
 */
export function buildAvatar(config = DEFAULT_CHARACTER) {
  const cfg = { ...DEFAULT_CHARACTER, ...config };
  const skin = lookup(SKIN_TONES, cfg.skin, 1).color;
  const hairColor = lookup(HAIR_COLORS, cfg.hairColor, 1).color;
  const shirt = lookup(CLOTH_COLORS, cfg.shirt, 0).color;
  const pants = lookup(CLOTH_COLORS, cfg.pants, 8).color;
  const shoes = lookup(CLOTH_COLORS, cfg.shoes, 11).color;
  const accessoryColor = lookup(CLOTH_COLORS, cfg.accessoryColor, 0).color;

  const root = new THREE.Group();
  const scale = characterScale(cfg);
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);

  const LEG_H = 0.75;
  const TORSO_H = 0.75;
  const HEAD_H = 0.5;
  const hipY = LEG_H;
  const shoulderY = hipY + TORSO_H - 0.08;
  const headY = hipY + TORSO_H + HEAD_H / 2;
  const headTop = hipY + TORSO_H + HEAD_H;

  // Torso.
  body.add(part(0.5, TORSO_H, 0.26, shirt, { y: hipY + TORSO_H / 2 }));
  // A collar so the shirt reads as clothing rather than paint.
  body.add(part(0.52, 0.08, 0.28, shirt, { y: hipY + TORSO_H - 0.04 }));

  // Legs, pivoting at the hip.
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.13, hipY, 0);
    pivot.add(part(0.24, LEG_H - 0.12, 0.24, pants, { y: -(LEG_H - 0.12) / 2 }));
    pivot.add(part(0.26, 0.14, 0.3, shoes, { y: -LEG_H + 0.07, z: 0.02 }));
    body.add(pivot);
    legs.push(pivot);
  }

  // Arms, pivoting at the shoulder and sitting flush against the torso.
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.36, shoulderY, 0);
    pivot.add(part(0.24, 0.52, 0.24, shirt, { y: -0.26 }));
    pivot.add(part(0.25, 0.18, 0.25, skin, { y: -0.61 }));
    body.add(pivot);
    arms.push(pivot);
  }

  // Head, with a face made of small blocks.
  const head = new THREE.Group();
  head.position.set(0, headY, 0);
  const headMesh = part(0.5, HEAD_H, 0.5, skin);
  head.add(headMesh);
  const eyeZ = 0.255;
  head.add(part(0.07, 0.09, 0.02, 0xf8f8f8, { x: -0.12, y: 0.05, z: eyeZ }));
  head.add(part(0.07, 0.09, 0.02, 0xf8f8f8, { x: 0.12, y: 0.05, z: eyeZ }));
  head.add(part(0.04, 0.05, 0.02, 0x2b2430, { x: -0.115, y: 0.04, z: eyeZ + 0.005 }));
  head.add(part(0.04, 0.05, 0.02, 0x2b2430, { x: 0.115, y: 0.04, z: eyeZ + 0.005 }));
  head.add(part(0.1, 0.03, 0.02, 0xc9736f, { y: -0.11, z: eyeZ }));
  head.add(part(0.06, 0.04, 0.02, 0xeaa0a8, { x: -0.19, y: -0.04, z: eyeZ }));
  head.add(part(0.06, 0.04, 0.02, 0xeaa0a8, { x: 0.19, y: -0.04, z: eyeZ }));
  body.add(head);

  // Hair and accessory hang off the head so they turn with it.
  const hairGroup = new THREE.Group();
  hairGroup.position.set(0, -headY, 0);
  head.add(hairGroup);
  buildHair(hairGroup, cfg.hair, hairColor, headTop, headY);
  buildAccessory(hairGroup, cfg.accessory, accessoryColor, headTop);

  root.userData = {
    config: cfg, body, head, arms, legs, scale,
    height: 2.0 * scale,
    phase: 0,
  };
  return root;
}

/** Swing the limbs. `speed` is horizontal movement speed in blocks/second. */
export function animateAvatar(avatar, dt, speed, { grounded = true } = {}) {
  const data = avatar.userData;
  if (!data) return;
  const moving = speed > 0.15;
  data.phase += dt * (moving ? Math.min(speed, 7) * 2.4 : 1.6);
  const swing = moving ? Math.min(speed / 4.5, 1) * 0.85 : 0;
  const idle = Math.sin(data.phase * 0.6) * 0.04;

  data.arms[0].rotation.x = Math.sin(data.phase) * swing + idle;
  data.arms[1].rotation.x = -Math.sin(data.phase) * swing - idle;
  data.legs[0].rotation.x = -Math.sin(data.phase) * swing;
  data.legs[1].rotation.x = Math.sin(data.phase) * swing;

  // A small bob while walking, and arms out a little when airborne.
  data.body.position.y = moving ? Math.abs(Math.sin(data.phase)) * 0.035 : 0;
  if (!grounded) {
    data.arms[0].rotation.x = -2.2;
    data.arms[1].rotation.x = -2.2;
  }
}

/** Point the head at something — used when a villager talks to you. */
export function lookAt(avatar, target) {
  const data = avatar.userData;
  if (!data) return;
  const dx = target.x - avatar.position.x;
  const dz = target.z - avatar.position.z;
  const desired = Math.atan2(dx, dz) - avatar.rotation.y;
  const clamped = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(desired), Math.cos(desired))));
  data.head.rotation.y += (clamped - data.head.rotation.y) * 0.15;
}

/** A random look, only ever using things she has unlocked. */
export function randomCharacter(seedName = 'Friend', owned = new Set()) {
  const pick = (all) => {
    const list = unlockedOptions(all, owned);
    return list[Math.floor(Math.random() * list.length)].id;
  };
  return {
    name: seedName,
    body: pick(BODY_TYPES),
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    shirt: pick(CLOTH_COLORS),
    pants: pick(CLOTH_COLORS),
    shoes: pick(CLOTH_COLORS),
    accessory: pick(ACCESSORIES),
    accessoryColor: pick(CLOTH_COLORS),
  };
}
