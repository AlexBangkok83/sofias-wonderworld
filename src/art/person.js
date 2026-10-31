import {
  INK, shade, rr, circ, ell, path, line, flat, g, svg, starPath, heartPath,
} from './kit.js';
import { isUnlocked } from '../shop/packs.js';

/**
 * People: big round heads, little bodies, dot eyes and rosy cheeks. Drawn in
 * SVG from a character config, in one of four poses:
 *
 *   stand — feet on the ground (the anchor is between the feet)
 *   sit   — on a chair or sofa (the anchor is the seat, under the hips)
 *   lie   — in bed, eyes closed (the anchor is the middle of the mattress)
 *   held  — dangling from a finger, arms up, mouth an "o"
 *
 * Ids in these lists are written into save files — never rename one.
 * Entries with a `pack` only appear once that shop pack is bought.
 */

export const SKIN_TONES = [
  { id: 'porcelain', color: '#f8e1cf' },
  { id: 'light', color: '#f3cfae' },
  { id: 'warm', color: '#e3ad80' },
  { id: 'tan', color: '#c98d5e' },
  { id: 'olive', color: '#a6744a' },
  { id: 'brown', color: '#7d5034' },
  { id: 'deep', color: '#573625' },
  { id: 'mint', color: '#bfe8d2' },
  { id: 'lilac', color: '#ddcdf2' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#2b2324' },
  { id: 'brown', color: '#5e3c26' },
  { id: 'chestnut', color: '#93552f' },
  { id: 'ginger', color: '#d16a3a' },
  { id: 'blonde', color: '#efcb72' },
  { id: 'platinum', color: '#f3ead2' },
  { id: 'pink', color: '#f08cba' },
  { id: 'purple', color: '#9c74cf' },
  { id: 'blue', color: '#6fa2e0' },
  { id: 'mint', color: '#8fdcbe' },
  { id: 'cherry', color: '#c7343f', pack: 'salon' },
  { id: 'teal', color: '#33a9a4', pack: 'salon' },
  { id: 'silver', color: '#cdd1dc', pack: 'salon' },
];

export const CLOTH_COLORS = [
  { id: 'rose', color: '#f28fac' },
  { id: 'red', color: '#e2554f' },
  { id: 'orange', color: '#f39a4b' },
  { id: 'yellow', color: '#f7d25e' },
  { id: 'green', color: '#7cc46a' },
  { id: 'mint', color: '#94dcc0' },
  { id: 'teal', color: '#3fa6a6' },
  { id: 'blue', color: '#5f9ce6' },
  { id: 'navy', color: '#3e5187' },
  { id: 'purple', color: '#9c7bd2' },
  { id: 'lilac', color: '#c9b2ee' },
  { id: 'brown', color: '#946a43' },
  { id: 'cream', color: '#f6ead3' },
  { id: 'white', color: '#fbf8f2' },
  { id: 'grey', color: '#a4a4ad' },
  { id: 'black', color: '#3a3540' },
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

export const OUTFITS = [
  { id: 'tee', label: 'T-shirt' },
  { id: 'dress', label: 'Dress' },
  { id: 'shorts', label: 'Shorts' },
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

export const BODY_TYPES = [
  { id: 'small', label: 'Small', scale: 0.84 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'tall', label: 'Tall', scale: 1.12 },
];

export const DEFAULT_CHARACTER = {
  name: 'Sofia',
  body: 'medium',
  skin: 'light',
  hair: 'long',
  hairColor: 'chestnut',
  outfit: 'dress',
  shirt: 'lilac',
  pants: 'navy',
  shoes: 'brown',
  accessory: 'flower',
  accessoryColor: 'rose',
};

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

/** A random look, only ever using things she has unlocked. */
export function randomCharacter(name = 'Friend', owned = new Set()) {
  const pick = (all) => {
    const list = unlockedOptions(all, owned);
    return list[Math.floor(Math.random() * list.length)].id;
  };
  return {
    name,
    body: pick(BODY_TYPES),
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    outfit: pick(OUTFITS),
    shirt: pick(CLOTH_COLORS),
    pants: pick(CLOTH_COLORS),
    shoes: pick(CLOTH_COLORS),
    accessory: pick(ACCESSORIES),
    accessoryColor: pick(CLOTH_COLORS),
  };
}

function colorOf(list, id, fallbackIndex) {
  return (list.find((e) => e.id === id) || list[fallbackIndex]).color;
}

export function bodyScale(cfg) {
  return (BODY_TYPES.find((b) => b.id === cfg.body) || BODY_TYPES[1]).scale;
}

// ---------------------------------------------------------------------------
// Drawing. Local coordinates: x = 0 is the middle, y = 0 is the floor under
// the feet, and up is negative. Head centre is (0, -119).
// ---------------------------------------------------------------------------

const BLUSH = '#f49fb3';

// Sitting: the body is lowered so the hips rest on the seat and the legs hang
// over its front edge.
const SIT_DROP = 40;
const GOLD = '#f6c94e';

function face(mood) {
  let out = '';
  if (mood === 'sleep') {
    out += line('M-17 -117 Q-12 -112 -7 -117');
    out += line('M7 -117 Q12 -112 17 -117');
  } else {
    for (const x of [-12, 12]) {
      out += ell(x, -118, 5, 6.5, INK, flat);
      out += circ(x + 1.6, -120.5, 1.9, '#fff', flat);
    }
  }
  out += ell(-21, -105, 6.5, 4, BLUSH, { stroke: null, opacity: 0.85 });
  out += ell(21, -105, 6.5, 4, BLUSH, { stroke: null, opacity: 0.85 });
  if (mood === 'surprised') out += ell(0, -101, 4.5, 5.5, '#8a3550', { sw: 2 });
  else if (mood === 'happy') out += path('M-8 -105 Q0 -94 8 -105 Z', '#8a3550', { sw: 2 });
  else if (mood === 'sleep') out += line('M-4 -102 Q0 -100 4 -102', INK, 2.5);
  else out += line('M-7 -104 Q0 -98 7 -104', INK, 2.5);
  return out;
}

/** Hair drawn behind the head. */
function hairBack(style, h) {
  switch (style) {
    case 'bob': return rr(-39, -150, 78, 62, 26, h);
    case 'long': return rr(-39, -150, 78, 100, 26, h);
    case 'ponytail':
      return ell(31, -132, 13, 26, h, { extra: 'transform="rotate(-18 31 -132)"' })
        + circ(25, -150, 6, '#f28fac');
    case 'buns': return circ(-27, -150, 15, h) + circ(27, -150, 15, h);
    case 'braids':
      return rr(-42, -134, 13, 76, 6, h) + rr(29, -134, 13, 76, 6, h)
        + rr(-43, -64, 15, 7, 3, '#f28fac') + rr(28, -64, 15, 7, 3, '#f28fac');
    case 'curly': {
      let out = '';
      for (const [x, y] of [[-34, -128], [34, -128], [-30, -146], [30, -146], [-14, -158], [14, -158], [0, -160]]) {
        out += circ(x, y, 14, h);
      }
      return out;
    }
    case 'pigtails':
      return ell(-45, -116, 12, 22, h) + ell(45, -116, 12, 22, h)
        + rr(-40, -136, 9, 10, 4, '#f28fac') + rr(31, -136, 9, 10, 4, '#f28fac');
    case 'puff': return circ(0, -142, 47, h);
    default: return '';
  }
}

/** Hair drawn over the top of the head (the fringe). */
function hairFront(style, h) {
  const fringe = path('M-34 -118 Q-37 -156 0 -156 Q37 -156 34 -118 Q26 -134 6 -137 Q-2 -130 -10 -137 Q-26 -136 -34 -118 Z', h);
  switch (style) {
    case 'bald': return '';
    case 'mohawk':
      return path('M-9 -150 Q-12 -172 0 -178 Q12 -172 9 -150 Z', h);
    case 'puff':
      return path('M-33 -128 Q-30 -152 0 -153 Q30 -152 33 -128 Q16 -140 0 -138 Q-16 -140 -33 -128 Z', h);
    case 'curly':
      return fringe + circ(-16, -150, 9, h) + circ(2, -154, 9, h) + circ(19, -149, 9, h);
    default: return fringe;
  }
}

function accessory(kind, a) {
  switch (kind) {
    case 'crown':
      return path('M-22 -146 L-24 -170 L-11 -158 L0 -174 L11 -158 L24 -170 L22 -146 Z', GOLD)
        + circ(0, -156, 4, a, { sw: 2 });
    case 'flower': {
      let out = '';
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        out += circ(26 + Math.cos(ang) * 7, -146 + Math.sin(ang) * 7, 6, a, { sw: 2 });
      }
      return out + circ(26, -146, 5, GOLD, { sw: 2 });
    }
    case 'bow':
      return path('M20 -152 L6 -162 L6 -142 Z', a) + path('M20 -152 L34 -162 L34 -142 Z', a)
        + circ(20, -152, 5, shade(a, -0.15), { sw: 2 });
    case 'ears':
      return path('M-30 -138 L-26 -168 L-8 -150 Z', a) + path('M30 -138 L26 -168 L8 -150 Z', a)
        + path('M-24 -146 L-23 -160 L-14 -151 Z', BLUSH, flat) + path('M24 -146 L23 -160 L14 -151 Z', BLUSH, flat);
    case 'hat':
      return path('M-26 -148 Q-4 -176 4 -210 Q14 -176 26 -148 Z', a)
        + ell(0, -147, 46, 9, a) + path(starPath(4, -170, 7), GOLD, { sw: 2 });
    case 'halo':
      return path(starPath(0, -182, 15), GOLD);
    case 'bunny':
      return ell(-15, -180, 10, 30, a) + ell(15, -180, 10, 30, a)
        + ell(-15, -178, 4.5, 20, BLUSH, flat) + ell(15, -178, 4.5, 20, BLUSH, flat);
    case 'bear':
      return circ(-27, -150, 13, a) + circ(27, -150, 13, a)
        + circ(-27, -150, 6, shade(a, -0.25), flat) + circ(27, -150, 6, shade(a, -0.25), flat);
    case 'unicorn':
      return path('M-9 -150 L1 -196 L9 -150 Z', a)
        + line('M-6 -162 L6 -166 M-4 -175 L5 -178', shade(a, -0.3), 2);
    case 'hearts':
      return path(heartPath(-13, -118, 22), a) + path(heartPath(13, -118, 22), a)
        + line('M-3 -121 L3 -121', INK, 2.5);
    case 'antennae':
      return line('M-12 -152 Q-16 -170 -24 -182') + line('M12 -152 Q16 -170 24 -182')
        + circ(-24, -184, 7, a) + circ(24, -184, 7, a);
    case 'tiara':
      return path('M-20 -146 L-20 -154 L-10 -151 L0 -163 L10 -151 L20 -154 L20 -146 Z', GOLD, { sw: 2.5 })
        + circ(0, -153, 3.5, a, { sw: 2 });
    default: return '';
  }
}

/** Body + head for a standing figure. `arms` lets the held pose raise them. */
function figure(cfg, { mood = 'smile', armsUp = false, sitting = false } = {}) {
  const skin = colorOf(SKIN_TONES, cfg.skin, 1);
  const hair = colorOf(HAIR_COLORS, cfg.hairColor, 2);
  const shirt = colorOf(CLOTH_COLORS, cfg.shirt, 10);
  const pants = colorOf(CLOTH_COLORS, cfg.pants, 8);
  const shoes = colorOf(CLOTH_COLORS, cfg.shoes, 11);
  const acc = colorOf(CLOTH_COLORS, cfg.accessoryColor, 0);
  const outfit = cfg.outfit || 'tee';

  let legs = '';
  if (sitting) {
    // Knees towards you: short legs and big shoes.
    const legColor = outfit === 'tee' ? pants : skin;
    legs += rr(-18, -44, 15, 34, 7, legColor) + rr(3, -44, 15, 34, 7, legColor);
    legs += ell(-11, -10, 13, 9, shoes) + ell(11, -10, 13, 9, shoes);
  } else {
    const legColor = outfit === 'tee' ? pants : skin;
    legs += rr(-17, -44, 13, 40, 6, legColor) + rr(4, -44, 13, 40, 6, legColor);
    legs += ell(-12, -6, 12, 7, shoes) + ell(12, -6, 12, 7, shoes);
  }
  if (outfit === 'shorts') legs += rr(-19, -50, 38, 20, 7, pants);

  const arm = (side) => {
    const x = side < 0 ? -36 : 23;
    const pivotX = side * 29;
    const rot = armsUp ? side * -155 : side * -6;
    return g(
      rr(x, -86, 13, 40, 6, skin) + rr(x - 1, -88, 15, 17, 6, shirt) + circ(pivotX, -48, 7, skin),
      `rotate(${rot} ${pivotX} -82)`,
    );
  };

  let torso;
  if (outfit === 'dress') {
    torso = path('M-21 -88 Q0 -93 21 -88 L33 -36 Q0 -29 -33 -36 Z', shirt)
      + line('M-27 -44 Q0 -39 27 -44', shade(shirt, -0.2), 2.5);
  } else {
    torso = rr(-24, -89, 48, 47, 14, shirt);
  }

  // Long hair hangs behind everything, so it goes down first.
  return hairBack(cfg.hair, hair)
    + legs + arm(-1) + arm(1) + torso
    + circ(-33, -114, 7, skin) + circ(33, -114, 7, skin)
    + rr(-33, -150, 66, 62, 28, skin)
    + face(mood)
    + hairFront(cfg.hair, hair)
    + accessory(cfg.accessory, acc);
}

/** Where the right hand is, in local units, for a pose — held things go here. */
export function handPoint(pose) {
  switch (pose) {
    case 'held': return { x: 44, y: -150 };
    case 'sit': return { x: 31, y: -8 + SIT_DROP };
    case 'lie': return null;
    default: return { x: 31, y: -42 };
  }
}

/** Size of the box every person is drawn in, and where the anchor sits in it. */
export const PERSON_BOX = { w: 220, h: 250, ax: 110, ay: 215 };

/**
 * A person as an <svg> string. `held` is optional inner SVG for whatever
 * they're holding, already drawn to sit with its bottom-centre at (0, 0).
 */
export function drawPerson(cfg, { pose = 'stand', mood, held = '' } = {}) {
  const s = bodyScale(cfg);
  let inner;
  if (pose === 'lie') {
    inner = g(figure(cfg, { mood: 'sleep' }), 'translate(78 -24) rotate(-90)');
  } else if (pose === 'sit') {
    // Anchor at the seat: the hips sit on it.
    inner = g(figure(cfg, { mood: mood || 'smile', sitting: true }), `translate(0 ${SIT_DROP})`);
  } else if (pose === 'held') {
    inner = figure(cfg, { mood: mood || 'surprised', armsUp: true });
  } else {
    inner = figure(cfg, { mood: mood || 'smile' });
  }
  const hand = handPoint(pose);
  if (held && hand) inner += g(held, `translate(${hand.x} ${hand.y})`);
  const { w, h, ax, ay } = PERSON_BOX;
  return svg(w, h, g(inner, `scale(${s})`), { viewBox: `${-ax} ${-ay} ${w} ${h}` });
}

/** The bounding box of a person in local units (anchor at 0,0), for hit tests. */
export function personBounds(cfg, pose = 'stand') {
  const s = bodyScale(cfg);
  if (pose === 'lie') return { x0: -80 * s, x1: 80 * s, y0: -64 * s, y1: 10 * s };
  if (pose === 'sit') return { x0: -40 * s, x1: 40 * s, y0: (-158 + SIT_DROP) * s, y1: SIT_DROP * s };
  return { x0: -40 * s, x1: 40 * s, y0: -158 * s, y1: 0 };
}
