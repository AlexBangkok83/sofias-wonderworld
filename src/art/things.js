import {
  INK, shade, rr, circ, ell, path, line, flat, thin, g, starPath, heartPath, seeded,
} from './kit.js';

/**
 * Every thing you can pick up: furniture, toys, food and animals.
 *
 * Each one is drawn in its own box, `w` × `h` world units, with its bottom
 * edge resting on whatever it stands on. Besides the picture, a thing says
 * how it behaves:
 *
 *   layer     'furniture' stands on floors; 'item' also on tables and shelves;
 *             'rug' lies flat under everything; 'wall' stays where you put it
 *   seats     where people sit or lie: [{ x, y, pose: 'sit' | 'lie' }]
 *   surface   a top other things can rest on: { y, x0, x1 }
 *   toggle    tap switches it on and off (lamps, TV, oven, fridge door…)
 *   holdable  can go in someone's hand
 *   food      can be eaten, a bite per tap while someone holds it
 *   says      an animal's noise, shown when you tap it
 *   floats    goes up instead of down (balloons)
 *   front     a part drawn in front of people — a blanket over a sleeper
 *   pack      only in the toy drawer once that shop pack is bought
 *
 * Ids are written into save files — never rename one.
 */

const WOOD = '#cf9558';
const DARKWOOD = '#95603a';
const CREAM = '#fbf3e4';
const WHITE = '#ffffff';
const GOLD = '#f6c94e';
const PINK = '#f49ab8';
const RED = '#e4574f';
const GREEN = '#7cc46a';
const LEAF = '#5fae62';
const BLUE = '#6aa7e8';
const STEEL = '#d7dbe6';

/** A soft pool of light behind something that's switched on. */
function glow(cx, cy, r, color = '#fff2b8') {
  return circ(cx, cy, r, color, { stroke: null, opacity: 0.22 })
    + circ(cx, cy, r * 0.66, color, { stroke: null, opacity: 0.3 })
    + circ(cx, cy, r * 0.36, color, { stroke: null, opacity: 0.4 });
}

const legs = (w, h, inset, color = DARKWOOD, height = 14) =>
  rr(inset, h - height, 9, height, 3, color) + rr(w - inset - 9, h - height, 9, height, 3, color);

export const THINGS = [
  // -------------------------------------------------------------------------
  // Furniture
  // -------------------------------------------------------------------------
  {
    id: 'bed', label: 'Bed', w: 230, h: 104, layer: 'furniture',
    seats: [{ x: 120, y: 60, pose: 'lie' }],
    draw: () => rr(4, 14, 34, 90, 10, WOOD) + rr(196, 40, 30, 64, 10, WOOD)
      + rr(26, 56, 184, 34, 10, WHITE) + legs(230, 104, 10)
      + rr(30, 40, 50, 22, 11, WHITE),
    front: () => rr(70, 54, 146, 40, 14, '#8fbde8') + line('M80 68 L206 68', '#bcd8f2', 3)
      + circ(110, 80, 4, WHITE, flat) + circ(150, 76, 4, WHITE, flat) + circ(186, 82, 4, WHITE, flat),
  },
  {
    id: 'sofa', label: 'Sofa', w: 230, h: 108, layer: 'furniture',
    seats: [{ x: 78, y: 70, pose: 'sit' }, { x: 152, y: 70, pose: 'sit' }],
    draw: () => rr(18, 14, 194, 56, 22, '#f08e7c') + rr(4, 46, 40, 52, 18, '#e9786a')
      + rr(186, 46, 40, 52, 18, '#e9786a') + rr(38, 64, 154, 30, 10, '#f6a596')
      + line('M115 66 L115 92', '#e9786a', 3) + legs(230, 108, 22, DARKWOOD, 12),
  },
  {
    id: 'armchair', label: 'Armchair', w: 124, h: 116, layer: 'furniture',
    seats: [{ x: 62, y: 76, pose: 'sit' }],
    draw: () => rr(16, 10, 92, 66, 24, '#8fcfb2') + rr(2, 50, 30, 54, 14, '#76bd9d')
      + rr(92, 50, 30, 54, 14, '#76bd9d') + rr(26, 70, 72, 28, 10, '#a6dcc3')
      + legs(124, 116, 14, DARKWOOD, 12),
  },
  {
    id: 'chair', label: 'Chair', w: 84, h: 124, layer: 'furniture',
    seats: [{ x: 44, y: 78, pose: 'sit' }],
    draw: () => rr(12, 6, 60, 70, 12, WOOD) + rr(22, 18, 40, 44, 8, shade(WOOD, 0.25), flat)
      + rr(6, 72, 72, 14, 6, DARKWOOD) + rr(12, 84, 9, 40, 3, DARKWOOD) + rr(63, 84, 9, 40, 3, DARKWOOD),
  },
  {
    id: 'table', label: 'Table', w: 200, h: 92, layer: 'furniture',
    surface: { y: 8, x0: 4, x1: 196 },
    draw: () => rr(2, 6, 196, 18, 7, WOOD) + rr(16, 22, 12, 70, 4, DARKWOOD) + rr(172, 22, 12, 70, 4, DARKWOOD)
      + path('M30 24 L100 40 L170 24', 'none', { sw: 3 }),
  },
  {
    id: 'nightstand', label: 'Little Table', w: 82, h: 82, layer: 'furniture',
    surface: { y: 6, x0: 4, x1: 78 },
    draw: () => rr(4, 6, 74, 64, 8, '#f3c5d8') + rr(14, 22, 54, 20, 5, '#f7d9e5') + circ(41, 32, 4, GOLD, thin)
      + legs(82, 82, 10, '#d78fb0', 14),
  },
  {
    id: 'counter', label: 'Kitchen Counter', w: 210, h: 104, layer: 'furniture',
    surface: { y: 8, x0: 2, x1: 208 },
    draw: () => rr(4, 16, 202, 86, 6, '#9fd3cf') + rr(0, 6, 210, 16, 5, CREAM)
      + rr(16, 32, 82, 60, 6, '#b8e1de') + rr(112, 32, 82, 60, 6, '#b8e1de')
      + rr(48, 40, 18, 6, 3, INK, flat) + rr(144, 40, 18, 6, 3, INK, flat),
  },
  {
    id: 'bookshelf', label: 'Bookshelf', w: 140, h: 232, layer: 'furniture',
    surface: { y: 4, x0: 4, x1: 136 },
    draw: () => {
      const rand = seeded(7);
      const colors = [RED, BLUE, GOLD, GREEN, '#a07ad6', PINK, '#f39a4b'];
      let books = '';
      for (const shelf of [24, 92, 160]) {
        let x = 16;
        while (x < 118) {
          const w = 10 + Math.floor(rand() * 8);
          const h = 40 + Math.floor(rand() * 18);
          books += rr(x, shelf + 58 - h, w, h, 3, colors[Math.floor(rand() * colors.length)], { sw: 2 });
          x += w + 2;
        }
      }
      return rr(4, 4, 132, 228, 8, DARKWOOD) + rr(14, 14, 112, 204, 4, shade(DARKWOOD, -0.25), flat)
        + books + rr(10, 82, 120, 10, 3, DARKWOOD) + rr(10, 150, 120, 10, 3, DARKWOOD) + rr(10, 218, 120, 10, 3, DARKWOOD);
    },
  },
  {
    id: 'fridge', label: 'Fridge', w: 104, h: 204, layer: 'furniture', toggle: true,
    draw: (st) => {
      const body = rr(6, 4, 92, 198, 14, '#e8f2f6') + line('M8 70 L96 70', INK, 3);
      if (!st.on) {
        return body + rr(80, 26, 7, 30, 3, STEEL) + rr(80, 90, 7, 40, 3, STEEL) + circ(30, 36, 6, PINK, thin);
      }
      // Door open: shelves of food inside.
      return body + rr(14, 12, 78, 186, 8, '#f6fbfd') + rr(14, 64, 78, 8, 3, STEEL) + rr(14, 128, 78, 8, 3, STEEL)
        + circ(32, 50, 11, RED) + circ(56, 52, 9, GOLD) + rr(28, 96, 22, 30, 5, WHITE) + rr(58, 102, 26, 24, 6, '#f6a596')
        + ell(40, 176, 18, 12, GREEN) + rr(62, 160, 20, 28, 4, BLUE)
        + rr(-34, 4, 40, 198, 12, '#dfeef3');
    },
  },
  {
    id: 'stove', label: 'Oven', w: 112, h: 112, layer: 'furniture', toggle: true,
    surface: { y: 10, x0: 4, x1: 108 },
    draw: (st) => rr(4, 10, 104, 100, 10, '#f7d25e') + rr(18, 42, 76, 54, 8, st.on ? '#ffb15c' : '#4a3d55')
      + rr(26, 50, 60, 6, 3, st.on ? '#ffe2a8' : '#6b5d78', flat) + rr(40, 26, 32, 8, 4, INK, flat)
      + circ(22, 26, 6, st.on ? RED : WHITE, thin) + circ(90, 26, 6, st.on ? RED : WHITE, thin)
      + (st.on ? path('M30 10 Q34 -6 38 10 M52 10 Q56 -10 60 10 M74 10 Q78 -6 82 10', '#ff8a3d', { sw: 2.5 }) : ''),
  },
  {
    id: 'bathtub', label: 'Bathtub', w: 230, h: 104, layer: 'furniture', toggle: true,
    seats: [{ x: 115, y: 70, pose: 'sit' }],
    draw: () => rr(190, 0, 10, 40, 4, STEEL) + rr(178, 0, 30, 10, 5, STEEL)
      + rr(8, 30, 214, 50, 26, '#cfeef6') + legs(230, 104, 26, STEEL, 20),
    front: (st) => {
      let foam = '';
      if (st.on) {
        for (const [x, r] of [[40, 16], [66, 20], [96, 15], [130, 19], [160, 16], [188, 18]]) {
          foam += circ(x, 46, r, WHITE, { sw: 2 });
        }
      }
      return foam + path('M8 50 L222 50 Q222 92 186 92 L44 92 Q8 92 8 50 Z', WHITE);
    },
  },
  {
    id: 'tv', label: 'TV', w: 150, h: 124, layer: 'furniture', toggle: true,
    draw: (st) => {
      let screen = rr(18, 12, 114, 70, 6, st.on ? '#8fd4f5' : '#3f3650');
      if (st.on) {
        screen += path('M18 70 Q50 40 80 62 Q104 46 132 66 L132 82 L18 82 Z', GREEN, { stroke: null })
          + circ(104, 30, 10, GOLD, { stroke: null }) + ell(52, 34, 18, 8, WHITE, { stroke: null });
      } else {
        screen += line('M30 24 L52 24', '#5c5070', 4);
      }
      return rr(8, 4, 134, 86, 12, '#5a4d6b') + screen + rr(14, 96, 122, 24, 6, DARKWOOD) + rr(64, 88, 22, 10, 3, '#5a4d6b');
    },
  },
  {
    id: 'floorlamp', label: 'Floor Lamp', w: 70, h: 186, layer: 'furniture', toggle: true,
    draw: (st) => (st.on ? glow(35, 30, 80) : '')
      + rr(31, 44, 8, 132, 4, '#5a4d6b') + ell(35, 178, 26, 8, '#5a4d6b')
      + path('M14 50 L24 6 L46 6 L56 50 Z', st.on ? '#fff0b3' : '#f2b4c7'),
  },
  {
    id: 'tablelamp', label: 'Table Lamp', w: 54, h: 72, layer: 'item', toggle: true,
    draw: (st) => (st.on ? glow(27, 22, 52) : '')
      + rr(23, 34, 8, 30, 3, '#5a4d6b') + ell(27, 66, 18, 6, '#5a4d6b')
      + path('M8 38 L16 8 L38 8 L46 38 Z', st.on ? '#fff0b3' : '#a7d8f0'),
  },
  {
    id: 'plant', label: 'Plant', w: 76, h: 112, layer: 'furniture',
    draw: () => ell(22, 40, 14, 30, LEAF, { extra: 'transform="rotate(-25 22 40)"' })
      + ell(54, 40, 14, 30, LEAF, { extra: 'transform="rotate(25 54 40)"' })
      + ell(38, 28, 15, 32, '#73c06f') + path('M14 68 L62 68 L54 110 L22 110 Z', '#ef8a62')
      + rr(10, 64, 56, 12, 5, '#f4a07c'),
  },
  {
    id: 'rug', label: 'Rug', w: 230, h: 18, layer: 'rug',
    draw: () => rr(2, 4, 226, 14, 7, '#b58ad8') + line('M22 11 L208 11', '#e8d3f8', 3),
  },
  {
    id: 'painting', label: 'Painting', w: 96, h: 76, layer: 'wall',
    draw: () => rr(2, 2, 92, 72, 6, GOLD) + rr(12, 12, 72, 52, 3, '#bfe6fb')
      + path('M12 64 L36 34 L54 52 L66 40 L84 64 Z', GREEN, { stroke: null }) + circ(68, 26, 7, '#ffcf5c', { stroke: null }),
  },
  {
    id: 'clock', label: 'Clock', w: 64, h: 64, layer: 'wall',
    draw: () => circ(32, 32, 29, '#f2b4c7') + circ(32, 32, 21, WHITE, thin) + line('M32 32 L32 18 M32 32 L42 36', INK, 3),
  },
  {
    id: 'lantern', label: 'Lantern', w: 50, h: 76, layer: 'wall', toggle: true, startsOn: true,
    draw: (st) => (st.on ? glow(25, 44, 70, '#ffe2a0') : '')
      + line('M25 0 L25 10') + rr(10, 10, 30, 8, 4, '#5a4d6b')
      + rr(8, 18, 34, 46, 8, st.on ? '#ffe08a' : '#cbbfd6') + rr(10, 62, 30, 8, 4, '#5a4d6b'),
  },
  {
    id: 'piano', label: 'Piano', w: 184, h: 148, layer: 'furniture', sound: 'piano',
    surface: { y: 6, x0: 6, x1: 178 },
    draw: () => {
      let keys = '';
      for (let i = 0; i < 9; i++) keys += rr(22 + i * 16, 70, 15, 26, 2, WHITE, { sw: 2 });
      for (const i of [0, 1, 3, 4, 5, 7]) keys += rr(32 + i * 16, 70, 9, 15, 2, INK, { stroke: null });
      return rr(6, 6, 172, 96, 10, '#3f3650') + rr(16, 64, 152, 36, 4, '#2d2639') + keys
        + rr(14, 96, 156, 12, 4, '#3f3650') + rr(20, 106, 12, 42, 4, '#3f3650') + rr(152, 106, 12, 42, 4, '#3f3650');
    },
  },
  {
    id: 'toybox', label: 'Toy Box', w: 120, h: 84, layer: 'furniture', toggle: true,
    surface: { y: 10, x0: 4, x1: 116 },
    draw: (st) => {
      const box = rr(6, 24, 108, 60, 8, '#7fc3e8') + path(starPath(60, 54, 14), GOLD, thin);
      if (!st.on) return box + rr(2, 12, 116, 18, 7, '#5fa9d6');
      return circ(36, 22, 14, RED) + circ(62, 18, 12, GOLD) + rr(76, 6, 22, 24, 6, GREEN)
        + box + rr(4, -26, 18, 52, 7, '#5fa9d6', { extra: 'transform="rotate(-24 13 12)"' });
    },
  },
  {
    id: 'haybale', label: 'Hay Bale', w: 120, h: 76, layer: 'furniture',
    seats: [{ x: 60, y: 10, pose: 'sit' }],
    surface: { y: 8, x0: 4, x1: 116 },
    draw: () => rr(4, 8, 112, 68, 12, '#f2cf6b') + line('M10 26 L110 26 M10 48 L110 48', '#d9ad45', 3)
      + rr(36, 8, 8, 68, 3, '#b07a3c', flat) + rr(76, 8, 8, 68, 3, '#b07a3c', flat),
  },
  {
    id: 'display', label: 'Cake Display', w: 196, h: 116, layer: 'furniture',
    surface: { y: 8, x0: 4, x1: 192 },
    draw: () => rr(4, 8, 188, 106, 10, '#f3c5d8') + rr(16, 20, 164, 52, 6, '#e6f5fb')
      + ell(48, 62, 18, 10, '#e0a35f') + ell(92, 60, 16, 12, '#f4d38a') + path('M120 70 Q132 44 144 70 Z', PINK)
      + circ(168, 60, 9, '#a4673a') + rr(16, 82, 164, 20, 6, '#f7d9e5'),
  },
  {
    id: 'desk', label: 'Desk', w: 170, h: 96, layer: 'furniture',
    surface: { y: 8, x0: 4, x1: 166 },
    draw: () => rr(2, 6, 166, 16, 6, '#a7d8b8') + rr(10, 22, 58, 74, 6, '#bfe3cc') + rr(20, 34, 38, 14, 4, '#d6efe0')
      + circ(39, 41, 3, INK, flat) + rr(148, 22, 12, 74, 4, '#8cc5a2'),
  },
  {
    id: 'bench', label: 'Bench', w: 190, h: 92, layer: 'furniture',
    seats: [{ x: 58, y: 52, pose: 'sit' }, { x: 132, y: 52, pose: 'sit' }],
    draw: () => rr(10, 6, 170, 16, 6, WOOD) + rr(10, 26, 170, 14, 6, WOOD) + rr(4, 46, 182, 16, 6, WOOD)
      + rr(22, 60, 10, 32, 3, '#5a4d6b') + rr(158, 60, 10, 32, 3, '#5a4d6b'),
  },
  {
    id: 'lamppost', label: 'Lamp Post', w: 60, h: 270, layer: 'furniture', toggle: true, startsOn: true,
    draw: (st) => (st.on ? glow(30, 36, 100, '#ffe9a8') : '')
      + rr(25, 56, 10, 206, 4, '#5a4d6b') + rr(12, 254, 36, 14, 6, '#5a4d6b')
      + rr(10, 16, 40, 44, 10, st.on ? '#ffe08a' : '#cbbfd6') + path('M6 18 L30 2 L54 18 Z', '#5a4d6b'),
  },
  {
    id: 'bush', label: 'Flower Bush', w: 110, h: 72, layer: 'furniture',
    draw: () => circ(30, 46, 26, LEAF) + circ(80, 46, 26, LEAF) + circ(55, 32, 30, '#6dbb66')
      + circ(36, 34, 6, PINK, thin) + circ(64, 22, 6, GOLD, thin) + circ(84, 40, 6, WHITE, thin) + circ(52, 50, 6, PINK, thin),
  },

  // -------------------------------------------------------------------------
  // Small things: food, toys
  // -------------------------------------------------------------------------
  {
    id: 'apple', label: 'Apple', w: 34, h: 36, layer: 'item', holdable: true, food: true, bite: [30, 16],
    draw: (st) => circ(17, 21, 14, RED) + line('M17 8 L19 2') + ell(25, 6, 6, 3, LEAF, thin),
  },
  {
    id: 'bread', label: 'Bread', w: 70, h: 36, layer: 'item', holdable: true, food: true, bite: [62, 18],
    draw: (st) => rr(4, 6, 62, 28, 14, '#e0a35f') + line('M20 12 L16 22 M36 12 L32 22 M52 12 L48 22', '#b97a3c', 3),
  },
  {
    id: 'croissant', label: 'Croissant', w: 62, h: 34, layer: 'item', holdable: true, food: true, bite: [56, 22],
    draw: (st) => path('M4 28 Q10 4 31 6 Q52 4 58 28 Q46 18 31 20 Q16 18 4 28 Z', '#efb563')
      + line('M22 10 L24 20 M40 10 L38 20', '#c88a3c', 2.5),
  },
  {
    id: 'cookie', label: 'Cookie', w: 34, h: 34, layer: 'item', holdable: true, food: true, bite: [30, 12],
    draw: (st) => circ(17, 18, 15, '#dfa968') + circ(11, 14, 3, '#6b4026', flat) + circ(22, 22, 3, '#6b4026', flat)
      + circ(20, 11, 2.5, '#6b4026', flat),
  },
  {
    id: 'carrot', label: 'Carrot', w: 22, h: 54, layer: 'item', holdable: true, food: true, bite: [12, 48],
    draw: (st) => path('M4 18 L18 18 L12 52 Z', '#f39a4b') + path('M11 18 L4 2 M11 18 L11 0 M11 18 L18 2', 'none', { stroke: LEAF, sw: 4 }),
  },
  {
    id: 'mug', label: 'Cup of Tea', w: 40, h: 40, layer: 'item', holdable: true,
    draw: () => rr(4, 10, 26, 28, 7, WHITE) + path('M30 16 Q40 16 40 24 Q40 32 30 32', 'none') + rr(8, 14, 18, 6, 3, '#c9905e', flat)
      + line('M12 6 Q15 2 12 -2 M20 6 Q23 2 20 -2', '#c7bed1', 2.5),
  },
  {
    id: 'book', label: 'Book', w: 44, h: 54, layer: 'item', holdable: true,
    draw: () => rr(4, 4, 36, 48, 4, BLUE) + rr(8, 4, 4, 48, 2, shade(BLUE, -0.2), flat)
      + path(starPath(26, 24, 8), GOLD, thin),
  },
  {
    id: 'teddy', label: 'Teddy', w: 54, h: 64, layer: 'item', holdable: true,
    draw: () => circ(12, 12, 8, '#b57b4e') + circ(42, 12, 8, '#b57b4e') + ell(27, 46, 18, 17, '#c88c5b')
      + circ(27, 22, 16, '#c88c5b') + ell(27, 28, 7, 5, '#ecc79f', thin) + circ(21, 19, 2.5, INK, flat)
      + circ(33, 19, 2.5, INK, flat) + circ(27, 26, 2, INK, flat) + ell(10, 52, 7, 6, '#b57b4e') + ell(44, 52, 7, 6, '#b57b4e'),
  },
  {
    id: 'ball', label: 'Ball', w: 42, h: 42, layer: 'item', holdable: true, bouncy: true,
    draw: () => circ(21, 21, 19, RED) + path('M4 16 Q21 26 38 16 M8 32 Q21 22 34 32', 'none', { stroke: WHITE, sw: 4 })
      + circ(21, 21, 19, 'none'),
  },
  {
    id: 'toycar', label: 'Toy Car', w: 66, h: 38, layer: 'item', holdable: true,
    draw: () => path('M6 26 L10 14 L22 14 L28 4 L46 4 L54 14 L62 16 L62 28 Z', BLUE)
      + rr(32, 8, 12, 8, 2, '#e6f5fb', thin) + circ(18, 30, 7, '#3f3650') + circ(50, 30, 7, '#3f3650')
      + circ(18, 30, 2.5, STEEL, flat) + circ(50, 30, 2.5, STEEL, flat),
  },
  {
    id: 'vase', label: 'Flowers', w: 50, h: 70, layer: 'item', holdable: true,
    draw: () => line('M25 40 L16 14 M25 40 L25 8 M25 40 L34 14', LEAF, 3)
      + circ(16, 12, 7, PINK) + circ(25, 6, 7, GOLD) + circ(34, 12, 7, '#a07ad6')
      + path('M14 38 L36 38 L33 68 L17 68 Z', '#8fd4f5'),
  },

  // -------------------------------------------------------------------------
  // Animals (the barn's)
  // -------------------------------------------------------------------------
  {
    id: 'cow', label: 'Cow', w: 170, h: 120, layer: 'item', says: 'Moooo!',
    draw: () => rr(18, 70, 12, 48, 5, WHITE) + rr(124, 70, 12, 48, 5, WHITE)
      + rr(30, 30, 116, 58, 26, WHITE) + ell(66, 52, 18, 13, INK, flat) + ell(116, 44, 12, 10, INK, flat)
      + rr(46, 70, 12, 48, 5, WHITE) + rr(108, 70, 12, 48, 5, WHITE)
      + path('M150 44 Q166 60 160 70', 'none') + rr(-2, 12, 52, 50, 22, WHITE)
      + ell(4, 22, 10, 6, WHITE) + ell(48, 18, 10, 6, WHITE) + rr(2, 40, 44, 22, 11, '#f7c5d2')
      + circ(14, 50, 3, INK, flat) + circ(32, 50, 3, INK, flat) + circ(14, 28, 3.5, INK, flat) + circ(36, 28, 3.5, INK, flat)
      + path('M12 12 L8 0 L18 8 Z M38 12 L44 0 L34 8 Z', GOLD, thin),
  },
  {
    id: 'chicken', label: 'Chicken', w: 54, h: 58, layer: 'item', holdable: true, says: 'Bawk bawk!',
    draw: () => line('M22 46 L20 56 M32 46 L34 56', '#f39a4b', 3) + ell(28, 34, 22, 16, WHITE)
      + circ(16, 18, 12, WHITE) + path('M10 8 Q12 0 16 6 Q19 -1 21 8 Z', RED, thin) + path('M4 18 L-4 21 L4 24 Z', GOLD, thin)
      + circ(13, 16, 2.5, INK, flat) + path('M40 30 Q48 20 52 30', 'none'),
  },
  {
    id: 'pig', label: 'Pig', w: 96, h: 70, layer: 'item', holdable: true, says: 'Oink oink!',
    draw: () => rr(16, 50, 10, 20, 4, '#f6b3c4') + rr(66, 50, 10, 20, 4, '#f6b3c4')
      + ell(52, 38, 38, 24, '#f8bfcd') + circ(20, 32, 20, '#f8bfcd') + path('M8 16 L10 4 L20 14 Z M26 14 L34 4 L34 18 Z', '#f6b3c4', thin)
      + ell(12, 38, 9, 7, '#f39ab2') + circ(9, 38, 2, INK, flat) + circ(15, 38, 2, INK, flat)
      + circ(14, 26, 2.5, INK, flat) + circ(26, 26, 2.5, INK, flat) + line('M90 30 Q98 26 92 22', INK, 2.5),
  },

  // -------------------------------------------------------------------------
  // 🍭 Candy pack
  // -------------------------------------------------------------------------
  {
    id: 'cupcake', label: 'Cupcake', w: 44, h: 52, layer: 'item', holdable: true, food: true, bite: [38, 20], pack: 'candy',
    draw: (st) => path('M8 28 L36 28 L32 50 L12 50 Z', '#7fc3e8') + circ(14, 24, 10, PINK) + circ(30, 24, 10, PINK)
      + circ(22, 16, 12, PINK) + circ(22, 4, 5, RED),
  },
  {
    id: 'lollipop', label: 'Lollipop', w: 40, h: 76, layer: 'item', holdable: true, food: true, bite: [36, 10], pack: 'candy',
    draw: (st) => rr(18, 34, 5, 42, 2, WHITE) + circ(20, 20, 18, '#f9a8c9')
      + path('M20 20 m-10 0 a10 10 0 1 1 20 0 a6 6 0 1 1 -12 0', 'none', { stroke: WHITE, sw: 4 }),
  },
  {
    id: 'icecream', label: 'Ice Cream', w: 40, h: 70, layer: 'item', holdable: true, food: true, bite: [32, 12], pack: 'candy',
    draw: (st) => path('M6 30 L34 30 L20 68 Z', '#e8b56b') + line('M12 38 L26 52 M28 38 L16 54', '#c9913f', 2)
      + circ(20, 22, 14, '#a8e3cc') + circ(20, 8, 9, PINK),
  },
  {
    id: 'cake', label: 'Big Cake', w: 92, h: 72, layer: 'item', food: true, bite: [84, 40], pack: 'candy',
    draw: (st) => rr(6, 30, 80, 40, 8, '#fbd9e4') + rr(6, 26, 80, 14, 7, WHITE) + line('M14 50 L78 50', PINK, 4)
      + rr(42, 8, 6, 18, 2, '#a7d8f0') + path('M45 0 Q50 6 45 8 Q40 6 45 0 Z', '#ffb15c', thin),
  },
  {
    id: 'gumball', label: 'Gumball Machine', w: 76, h: 128, layer: 'item', toggle: true, pack: 'candy',
    draw: (st) => {
      const rand = seeded(st.on ? 3 : 9);
      let balls = '';
      const colors = [RED, GOLD, BLUE, GREEN, PINK, '#a07ad6'];
      for (let i = 0; i < 12; i++) {
        balls += circ(20 + rand() * 36, 22 + rand() * 30, 7, colors[i % colors.length], { sw: 2 });
      }
      return circ(38, 38, 32, '#e9f6fb') + balls + rr(14, 66, 48, 54, 8, RED) + rr(30, 82, 16, 14, 4, GOLD, thin)
        + rr(10, 116, 56, 10, 4, '#b8333a') + (st.on ? circ(38, 106, 6, colors[Math.floor(rand() * 6)], thin) : '');
    },
  },

  // -------------------------------------------------------------------------
  // 🐚 Ocean pack
  // -------------------------------------------------------------------------
  {
    id: 'fishbowl', label: 'Fish Bowl', w: 84, h: 78, layer: 'item', toggle: true, startsOn: true, pack: 'ocean',
    draw: (st) => {
      const fishX = st.on ? 48 : 30;
      return circ(42, 42, 34, '#bfe8f7') + path('M10 46 Q42 54 74 46 Q70 74 42 76 Q14 74 10 46 Z', '#8fd4f5', { stroke: null })
        + ell(fishX, 48, 12, 8, '#f39a4b', thin) + path(`M${fishX + 10} 48 L${fishX + 20} 41 L${fishX + 20} 55 Z`, '#f39a4b', thin)
        + circ(fishX - 5, 46, 2, INK, flat) + (st.on ? circ(30, 30, 4, WHITE, thin) + circ(36, 18, 3, WHITE, thin) : '')
        + rr(22, 6, 40, 8, 4, '#bfe8f7');
    },
  },
  {
    id: 'beachball', label: 'Beach Ball', w: 54, h: 54, layer: 'item', holdable: true, bouncy: true, pack: 'ocean',
    draw: () => circ(27, 27, 25, WHITE) + path('M27 2 Q12 27 27 52 Q8 50 2 27 Q8 4 27 2 Z', RED, { stroke: null })
      + path('M27 2 Q42 27 27 52 Q46 50 52 27 Q46 4 27 2 Z', BLUE, { stroke: null }) + circ(27, 27, 25, 'none'),
  },
  {
    id: 'shell', label: 'Seashell', w: 50, h: 40, layer: 'item', holdable: true, pack: 'ocean',
    draw: () => path('M4 34 Q6 4 25 2 Q44 4 46 34 Z', '#fbd5c5') + line('M25 34 L25 6 M25 34 L12 10 M25 34 L38 10', '#e8a993', 2.5)
      + rr(16, 32, 18, 6, 3, '#f4b9a5'),
  },
  {
    id: 'duck', label: 'Rubber Duck', w: 52, h: 44, layer: 'item', holdable: true, sound: 'squeak', pack: 'ocean',
    draw: () => ell(28, 32, 22, 12, '#ffd84d') + circ(18, 16, 12, '#ffd84d') + path('M4 16 L-6 19 L4 22 Z', '#f39a4b', thin)
      + circ(15, 13, 2.5, INK, flat) + path('M30 26 Q40 22 44 30', 'none', { sw: 2.5 }),
  },
  {
    id: 'surfboard', label: 'Surfboard', w: 64, h: 190, layer: 'furniture', pack: 'ocean',
    draw: () => ell(32, 96, 24, 92, '#8fd4f5') + path('M32 6 L32 186', 'none', { stroke: '#f39a4b', sw: 6 })
      + path(heartPath(32, 70, 20), PINK, thin),
  },

  // -------------------------------------------------------------------------
  // 🐰 Animal Friends pack
  // -------------------------------------------------------------------------
  {
    id: 'kitty', label: 'Kitty', w: 60, h: 56, layer: 'item', holdable: true, says: 'Meow!', pack: 'animals',
    draw: () => line('M48 40 Q62 34 56 18', '#f39a4b', 6) + ell(32, 42, 20, 13, '#f8b06a')
      + circ(22, 26, 16, '#f8b06a') + path('M10 18 L8 2 L20 12 Z M26 12 L36 2 L34 18 Z', '#f8b06a')
      + circ(17, 25, 2.5, INK, flat) + circ(27, 25, 2.5, INK, flat) + path('M20 31 L24 31 L22 33 Z', PINK, flat)
      + line('M6 30 L14 30 M30 30 L38 30', INK, 1.5),
  },
  {
    id: 'puppy', label: 'Puppy', w: 68, h: 60, layer: 'item', holdable: true, says: 'Woof woof!', pack: 'animals',
    draw: () => line('M56 34 Q66 24 62 16', '#d9b48a', 6) + ell(38, 44, 24, 14, '#ecd2b0')
      + circ(22, 28, 18, '#ecd2b0') + ell(8, 30, 7, 14, '#a8784a') + ell(36, 30, 7, 14, '#a8784a')
      + circ(17, 26, 2.5, INK, flat) + circ(27, 26, 2.5, INK, flat) + ell(22, 34, 4, 3, INK, flat)
      + path('M20 40 Q22 46 24 40 Z', PINK, { sw: 1.5 }),
  },
  {
    id: 'bunnypet', label: 'Bunny', w: 52, h: 66, layer: 'item', holdable: true, says: '*wiggles nose*', pack: 'animals',
    draw: () => ell(18, 14, 6, 15, WHITE) + ell(32, 14, 6, 15, WHITE) + ell(18, 14, 2.5, 10, PINK, flat)
      + ell(32, 14, 2.5, 10, PINK, flat) + ell(28, 52, 20, 13, WHITE) + circ(25, 36, 14, WHITE) + circ(46, 54, 5, WHITE)
      + circ(20, 34, 2.2, INK, flat) + circ(30, 34, 2.2, INK, flat) + circ(25, 40, 2, PINK, flat),
  },

  // -------------------------------------------------------------------------
  // 🌈 Rainbow pack
  // -------------------------------------------------------------------------
  {
    id: 'rainbowrug', label: 'Rainbow Rug', w: 220, h: 18, layer: 'rug', pack: 'rainbow',
    draw: () => {
      const colors = [RED, '#f39a4b', GOLD, GREEN, BLUE, '#a07ad6'];
      let out = rr(2, 4, 216, 14, 7, WHITE);
      colors.forEach((c, i) => { out += rr(14 + i * 32, 6, 30, 10, 4, c, flat); });
      return out;
    },
  },
  {
    id: 'cloudlamp', label: 'Cloud Lamp', w: 84, h: 56, layer: 'item', toggle: true, pack: 'rainbow',
    draw: (st) => (st.on ? glow(42, 28, 64, '#e6f0ff') : '')
      + path('M10 50 Q0 50 2 38 Q4 26 18 28 Q20 10 38 12 Q50 2 62 14 Q80 12 80 30 Q86 50 70 50 Z', st.on ? WHITE : '#dfe6f2')
      + (st.on ? circ(30, 34, 2.5, INK, flat) + circ(52, 34, 2.5, INK, flat) + line('M36 40 Q41 44 46 40', INK, 2) : ''),
  },
  {
    id: 'unicornplush', label: 'Unicorn', w: 66, h: 70, layer: 'item', holdable: true, pack: 'rainbow',
    draw: () => ell(36, 50, 22, 15, WHITE) + rr(18, 56, 8, 14, 4, WHITE) + rr(44, 56, 8, 14, 4, WHITE)
      + circ(20, 30, 15, WHITE) + path('M16 16 L18 -4 L24 16 Z', GOLD, thin)
      + path('M28 18 Q40 22 38 40 Q46 28 40 16 Z', '#c9a7f0', thin) + path('M56 44 Q66 46 62 58', 'none', { stroke: PINK, sw: 5 })
      + circ(16, 30, 2.5, INK, flat) + ell(10, 36, 3, 2, PINK, flat),
  },
  {
    id: 'balloon', label: 'Heart Balloon', w: 54, h: 120, layer: 'item', holdable: true, floats: true, pack: 'rainbow',
    draw: () => line('M27 50 Q20 80 30 118', INK, 2) + path(heartPath(27, 28, 52), '#ff6b8f'),
  },

  // -------------------------------------------------------------------------
  // 🚀 Space pack
  // -------------------------------------------------------------------------
  {
    id: 'rocket', label: 'Rocket', w: 96, h: 200, layer: 'furniture', toggle: true, pack: 'space',
    draw: (st) => (st.on ? path('M30 168 Q48 230 66 168 Z', '#ffb15c') + path('M38 168 Q48 206 58 168 Z', '#ffe08a', flat) : '')
      + path('M8 170 L28 120 L28 170 Z', RED) + path('M88 170 L68 120 L68 170 Z', RED)
      + path('M28 172 L28 60 Q48 0 68 60 L68 172 Z', '#eef1f7') + circ(48, 82, 13, '#8fd4f5')
      + path('M28 60 Q48 0 68 60 Z', RED) + rr(30, 160, 36, 14, 4, '#a4a4ad'),
  },
  {
    id: 'telescope', label: 'Telescope', w: 110, h: 150, layer: 'furniture', pack: 'space',
    draw: () => line('M54 80 L22 148 M54 80 L86 148 M54 80 L54 148', '#5a4d6b', 5)
      + rr(10, 46, 96, 26, 10, '#5f9ce6', { extra: 'transform="rotate(-28 58 59)"' })
      + rr(90, 16, 14, 34, 5, '#3e5187', { extra: 'transform="rotate(-28 97 33)"' }),
  },
  {
    id: 'planetlamp', label: 'Planet Lamp', w: 80, h: 70, layer: 'item', toggle: true, pack: 'space',
    draw: (st) => (st.on ? glow(40, 34, 60, '#e2d4ff') : '')
      + circ(40, 32, 22, st.on ? '#c9a7f0' : '#9c7bd2') + ell(40, 34, 38, 9, 'none', { stroke: GOLD, sw: 5 })
      + rr(30, 58, 20, 10, 4, '#5a4d6b'),
  },
  {
    id: 'alien', label: 'Alien Friend', w: 52, h: 66, layer: 'item', holdable: true, says: 'Blip blop!', pack: 'space',
    draw: () => line('M16 12 L10 0 M36 12 L42 0', INK, 2.5) + circ(10, 0, 4, GOLD, thin) + circ(42, 0, 4, GOLD, thin)
      + rr(10, 40, 32, 24, 12, '#7fdc8a') + circ(26, 26, 18, '#7fdc8a') + ell(19, 26, 5, 7, INK, flat)
      + ell(33, 26, 5, 7, INK, flat) + circ(21, 24, 1.8, WHITE, flat) + circ(35, 24, 1.8, WHITE, flat),
  },

  // -------------------------------------------------------------------------
  // 🏰 Castle pack
  // -------------------------------------------------------------------------
  {
    id: 'throne', label: 'Throne', w: 124, h: 176, layer: 'furniture', pack: 'castle',
    seats: [{ x: 62, y: 124, pose: 'sit' }],
    draw: () => path('M14 120 L14 30 L34 44 L62 6 L90 44 L110 30 L110 120 Z', GOLD)
      + rr(30, 48, 64, 70, 14, '#c0395b') + circ(62, 28, 6, '#5fa9d6', thin)
      + rr(4, 112, 116, 22, 8, GOLD) + rr(18, 132, 88, 30, 6, '#e3a832') + rr(14, 160, 14, 16, 4, '#e3a832') + rr(96, 160, 14, 16, 4, '#e3a832'),
  },
  {
    id: 'chest', label: 'Treasure Chest', w: 104, h: 84, layer: 'furniture', toggle: true, pack: 'castle',
    surface: { y: 26, x0: 4, x1: 100 },
    draw: (st) => {
      const box = rr(6, 34, 92, 50, 6, '#b8743f') + rr(6, 34, 92, 10, 3, GOLD) + rr(44, 40, 16, 18, 4, GOLD);
      if (!st.on) return box + path('M6 36 L6 22 Q52 -2 98 22 L98 36 Z', '#c98448') + rr(44, 24, 16, 14, 4, GOLD);
      // Lid thrown back behind the box, gold spilling over the top.
      return path('M6 36 L2 4 Q52 -16 102 4 L98 36 Z', '#a8683a') + circ(28, 32, 10, GOLD) + circ(52, 26, 11, GOLD)
        + circ(76, 32, 10, GOLD) + path(starPath(52, 24, 6), WHITE, flat) + box;
    },
  },
  {
    id: 'canopybed', label: 'Royal Bed', w: 240, h: 230, layer: 'furniture', pack: 'castle',
    seats: [{ x: 124, y: 186, pose: 'lie' }],
    draw: () => rr(8, 10, 12, 220, 4, GOLD) + rr(220, 10, 12, 220, 4, GOLD)
      + path('M0 8 Q120 -12 240 8 L240 40 Q200 24 160 40 Q120 24 80 40 Q40 24 0 40 Z', '#c0395b')
      + rr(14, 140, 34, 90, 10, GOLD) + rr(26, 182, 190, 34, 10, WHITE) + rr(34, 166, 54, 22, 11, WHITE),
    front: () => rr(74, 180, 152, 42, 14, '#9c7bd2') + path(starPath(150, 200, 9), GOLD, thin),
  },
  {
    id: 'wand', label: 'Magic Wand', w: 30, h: 76, layer: 'item', holdable: true, sound: 'sparkle', pack: 'castle',
    draw: () => rr(13, 26, 5, 50, 2, '#5a4d6b') + path(starPath(15, 16, 15), GOLD),
  },
];

export const THING_BY_ID = new Map(THINGS.map((t) => [t.id, t]));

export function getThing(id) {
  return THING_BY_ID.get(id) || null;
}

/** Every thing that comes in a given pack. */
export function packThings(packId) {
  return THINGS.filter((t) => t.pack === packId);
}

/** Bites until food is all gone. */
export const BITES = 3;

/** A thing's starting state when it's first put somewhere. */
export function freshState(def) {
  return def.toggle ? { on: !!def.startsOn } : {};
}

/**
 * The inside of a thing's <svg>: its drawing, with bites taken out of food.
 * `key` must be unique on the page (the bite mask needs an id).
 */
export function drawThing(def, st = {}, key = 'x') {
  let inner = def.draw(st);
  if (def.food && st.bites) {
    const [bx, by] = def.bite || [def.w - 6, def.h / 3];
    let holes = '';
    for (let i = 0; i < st.bites; i++) {
      holes += `<circle cx="${bx - i * 9}" cy="${by + (i % 2) * 8}" r="9" fill="black"/>`;
    }
    const id = `bite-${key}`;
    inner = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="${def.w + 60}" `
      + `height="${def.h + 60}"><rect x="-30" y="-30" width="${def.w + 60}" height="${def.h + 60}" fill="white"/>`
      + `${holes}</mask></defs><g mask="url(#${id})">${inner}</g>`;
  }
  return inner;
}

/** Drawn in front of people (blankets, bath foam), or '' if nothing is. */
export function drawThingFront(def, st = {}) {
  return def.front ? def.front(st) : '';
}
