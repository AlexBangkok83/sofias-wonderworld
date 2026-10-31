import * as THREE from 'three';

// Procedural 16x16 pixel-art textures. Everything is drawn at runtime so the
// game ships as pure code — no image assets to load, nothing to 404 on a phone.

const TILE = 16;

// Deterministic value noise so a texture looks the same every session.
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function newTile() {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function shade(hex, amount) {
  const c = new THREE.Color(hex);
  if (amount >= 0) c.lerp(new THREE.Color(0xffffff), amount);
  else c.lerp(new THREE.Color(0x000000), -amount);
  return `#${c.getHexString()}`;
}

/** Flat base colour speckled with soft noise — the workhorse look. */
export function speckle(base, strength = 0.08, seed = 1) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = typeof base === 'string' ? base : shade(base, 0);
    ctx.fillRect(0, 0, TILE, TILE);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = (rand() - 0.5) * 2 * strength;
        px(ctx, x, y, shade(base, n));
      }
    }
  };
}

/** Horizontal planks with dark seams and a bit of grain. */
export function planks(base, seed = 2) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.12));
      }
    }
    // Plank seams every 4 rows.
    for (let y = 0; y < TILE; y += 4) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(base, -0.34));
      for (let x = 0; x < TILE; x++) px(ctx, x, y + 3, shade(base, -0.14));
    }
    // Board ends, offset per row so it doesn't look like a grid.
    for (let row = 0; row < 4; row++) {
      const x = (row * 7 + 3) % TILE;
      for (let y = row * 4 + 1; y < row * 4 + 4; y++) px(ctx, x, y, shade(base, -0.28));
    }
    // Knots.
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(rand() * TILE);
      const y = Math.floor(rand() * TILE);
      px(ctx, x, y, shade(base, -0.22));
    }
  };
}

/** Vertical beams / logs. */
export function beam(base, seed = 3) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.1));
      }
    }
    for (const x of [0, 5, 10, 15]) {
      for (let y = 0; y < TILE; y++) px(ctx, x, y, shade(base, -0.26));
    }
  };
}

/** Rough plaster / stucco — the cottage's white walls. */
export function plaster(base, seed = 4) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = (rand() - 0.5) * 0.09;
        px(ctx, x, y, shade(base, n));
      }
    }
    // A few trowel dimples so it isn't dead flat.
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(rand() * TILE);
      const y = Math.floor(rand() * TILE);
      px(ctx, x, y, shade(base, -0.09));
    }
  };
}

/** Irregular cobble / fieldstone. */
export function cobble(base, seed = 5) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = shade(base, -0.3);
    ctx.fillRect(0, 0, TILE, TILE);
    const stones = [
      [0, 0, 7, 5], [8, 0, 8, 7], [0, 6, 5, 5], [6, 8, 6, 4],
      [13, 8, 3, 8], [0, 12, 6, 4], [6, 13, 6, 3], [12, 0, 4, 0],
    ];
    for (const [sx, sy, sw, sh] of stones) {
      const tone = shade(base, (rand() - 0.4) * 0.3);
      ctx.fillStyle = tone;
      ctx.fillRect(sx, sy, Math.max(1, sw - 1), Math.max(1, sh - 1));
      ctx.fillStyle = shade(base, 0.12);
      ctx.fillRect(sx, sy, Math.max(1, sw - 1), 1);
    }
  };
}

/** Roof shingles / slates, overlapping rows. */
export function shingle(base, seed = 6) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = shade(base, -0.2);
    ctx.fillRect(0, 0, TILE, TILE);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const offset = row % 2 === 0 ? 0 : 4;
      for (let i = -1; i < 3; i++) {
        const x = i * 8 + offset;
        ctx.fillStyle = shade(base, (rand() - 0.45) * 0.22);
        ctx.fillRect(x, y, 7, 3);
        ctx.fillStyle = shade(base, 0.1);
        ctx.fillRect(x, y, 7, 1);
      }
    }
  };
}

/** Grass top: green with tufts. */
export function grassTop(base, seed = 7) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.22));
      }
    }
    for (let i = 0; i < 18; i++) {
      const x = Math.floor(rand() * TILE);
      const y = Math.floor(rand() * TILE);
      px(ctx, x, y, shade(base, 0.18));
    }
  };
}

/** Grass side: dirt with a green lip along the top. */
export function grassSide(dirt, grass, seed = 8) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(dirt, (rand() - 0.5) * 0.22));
      }
    }
    for (let x = 0; x < TILE; x++) {
      const h = 3 + Math.floor(rand() * 3);
      for (let y = 0; y < h; y++) px(ctx, x, y, shade(grass, (rand() - 0.5) * 0.2));
    }
  };
}

/** Window glass: mostly clear with a highlight streak and a frame edge. */
export function glassPane(tint, seed = 9) {
  return (ctx) => {
    ctx.clearRect(0, 0, TILE, TILE);
    ctx.fillStyle = tint;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.globalAlpha = 1;
    // Frame.
    ctx.strokeStyle = shade(tint, -0.25);
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
    // Diagonal shine.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(3, 12);
    ctx.lineTo(11, 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(6, 13);
    ctx.lineTo(13, 6);
    ctx.stroke();
  };
}

/** Leaves — dense dark green with holes punched through. */
export function leaves(base, seed = 10) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const r = rand();
        if (r < 0.1) {
          ctx.clearRect(x, y, 1, 1);
        } else {
          px(ctx, x, y, shade(base, (r - 0.5) * 0.4));
        }
      }
    }
  };
}

/** Lantern: warm glass box in a dark frame. */
export function lantern(seed = 11) {
  return (ctx) => {
    ctx.fillStyle = '#4a3524';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#fff3cf';
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 3, 3);
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(0, 0, TILE, 2);
    ctx.fillRect(0, TILE - 2, TILE, 2);
    ctx.fillRect(0, 0, 2, TILE);
    ctx.fillRect(TILE - 2, 0, 2, TILE);
    ctx.fillStyle = '#2b1e14';
    ctx.fillRect(7, 0, 2, 3);
  };
}

/** Bookshelf: wood frame packed with coloured spines. */
export function bookshelf(seed = 12) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = '#8a6236';
    ctx.fillRect(0, 0, TILE, TILE);
    const spines = ['#b8524e', '#4e7bb8', '#c9a24a', '#5ea36a', '#8a5eb8', '#c96f9b'];
    for (const shelfY of [1, 9]) {
      let x = 1;
      while (x < TILE - 1) {
        const w = 1 + Math.floor(rand() * 2);
        const h = 6 - Math.floor(rand() * 2);
        ctx.fillStyle = spines[Math.floor(rand() * spines.length)];
        ctx.fillRect(x, shelfY + (6 - h), Math.min(w, TILE - 1 - x), h);
        x += w + 1;
      }
    }
    ctx.fillStyle = '#6b4a28';
    ctx.fillRect(0, 7, TILE, 2);
    ctx.fillRect(0, 15, TILE, 1);
    ctx.fillRect(0, 0, TILE, 1);
  };
}

/** Wool / soft fabric — gentle weave. */
export function wool(base, seed = 13) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const weave = (x + y) % 4 === 0 ? -0.06 : (x % 4 === 2 && y % 4 === 2 ? 0.07 : 0);
        px(ctx, x, y, shade(base, weave + (rand() - 0.5) * 0.05));
      }
    }
  };
}

/** Carpet / rug with a border. */
export function rug(base, trim, seed = 14) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.08));
      }
    }
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, TILE - 4, TILE - 4);
  };
}

/** Flower cross-plane: stem plus a bloom, transparent background. */
export function flower(petal, seed = 15) {
  return (ctx) => {
    ctx.clearRect(0, 0, TILE, TILE);
    // Stem.
    ctx.fillStyle = '#4f8a45';
    ctx.fillRect(7, 7, 2, 9);
    ctx.fillRect(4, 10, 3, 1);
    ctx.fillRect(9, 12, 3, 1);
    // Bloom.
    ctx.fillStyle = petal;
    ctx.fillRect(5, 3, 6, 5);
    ctx.fillRect(4, 4, 8, 3);
    ctx.fillStyle = shade(petal, 0.25);
    ctx.fillRect(6, 4, 2, 2);
    ctx.fillStyle = '#f7e07a';
    ctx.fillRect(7, 5, 2, 2);
  };
}

/** Tall grass tuft, transparent background. */
export function tuft(base, seed = 16) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.clearRect(0, 0, TILE, TILE);
    for (let x = 2; x < TILE - 2; x += 2) {
      const h = 6 + Math.floor(rand() * 7);
      const lean = rand() < 0.5 ? 0 : 1;
      for (let y = 0; y < h; y++) {
        px(ctx, x + (y > h - 3 ? lean : 0), TILE - 1 - y, shade(base, (rand() - 0.5) * 0.25));
      }
    }
  };
}

/** Hanging vine, transparent background. */
export function vine(base, seed = 17) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.clearRect(0, 0, TILE, TILE);
    for (const x of [3, 8, 12]) {
      for (let y = 0; y < TILE; y++) {
        if (rand() < 0.12) continue;
        px(ctx, x + (y % 5 === 0 ? 1 : 0), y, shade(base, (rand() - 0.5) * 0.3));
        if (rand() < 0.3) px(ctx, x + 1, y, shade(base, -0.15));
      }
    }
  };
}

/** Pale glowing moonstone with a soft crater pattern. */
export function moonstone(seed = 18) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(0xf2eef7, (rand() - 0.5) * 0.09));
      }
    }
    for (const [cx, cy, r] of [[4, 5, 2], [11, 9, 3], [7, 13, 2]]) {
      ctx.fillStyle = shade(0xd9d2e8, -0.05);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

/** Water: gentle bands. */
export function water(seed = 19) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const band = Math.sin((x * 0.6 + y * 1.4)) * 0.06;
        px(ctx, x, y, shade(0x4f9dd6, band + (rand() - 0.5) * 0.06));
      }
    }
  };
}

/** Stone path with mossy joints. */
export function pathStone(seed = 20) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = '#7f8676';
    ctx.fillRect(0, 0, TILE, TILE);
    for (const [sx, sy, sw, sh] of [[1, 1, 6, 6], [8, 1, 7, 6], [1, 8, 7, 7], [9, 8, 6, 7]]) {
      ctx.fillStyle = shade(0xc9c3b4, (rand() - 0.5) * 0.16);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = shade(0xc9c3b4, 0.12);
      ctx.fillRect(sx, sy, sw, 1);
    }
  };
}

// ---------------------------------------------------------------------------
// Shop pack blocks
// ---------------------------------------------------------------------------

/** Diagonal two-colour stripes — candy cane. */
export function candyStripe(a, b, seed = 60) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const base = Math.floor((x + y) / 4) % 2 === 0 ? a : b;
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.05));
      }
    }
  };
}

/** A chocolate bar: square segments with a lit top edge. */
export function chocolate(seed = 61) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = shade(0x5a3320, -0.25);
    ctx.fillRect(0, 0, TILE, TILE);
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const x = gx * 8;
        const y = gy * 8;
        ctx.fillStyle = shade(0x5a3320, (rand() - 0.5) * 0.06);
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = shade(0x5a3320, 0.2);
        ctx.fillRect(x + 1, y + 1, 6, 1);
        ctx.fillRect(x + 1, y + 1, 1, 6);
        ctx.fillStyle = shade(0x5a3320, 0.42);
        ctx.fillRect(x + 2, y + 2, 1, 1);
      }
    }
  };
}

/** Icing seen from above. */
export function icingTop(icing, seed = 62) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(icing, (rand() - 0.5) * 0.08));
      }
    }
    // A cherry on top.
    ctx.fillStyle = '#d63a4f';
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = '#f08a98';
    ctx.fillRect(7, 7, 1, 1);
  };
}

/** Sponge cake with icing dripping down from the top edge. */
export function icingSide(icing, cake, seed = 63) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ctx, x, y, shade(cake, (rand() - 0.5) * 0.14));
      }
    }
    for (let x = 0; x < TILE; x++) {
      const drip = 3 + (x % 5 === 1 ? 4 : x % 7 === 3 ? 3 : Math.floor(rand() * 2));
      for (let y = 0; y < drip; y++) px(ctx, x, y, shade(icing, (rand() - 0.5) * 0.06));
    }
    // A jam layer through the middle.
    ctx.fillStyle = '#d6566c';
    ctx.fillRect(0, 10, TILE, 1);
  };
}

/** Pale icing scattered with coloured sprinkles. */
export function sprinkles(base, seed = 64) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(base, (rand() - 0.5) * 0.06));
    }
    const colours = ['#e6546c', '#f2c94c', '#56b6e6', '#7bd389', '#a77ce0', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const x = Math.floor(rand() * (TILE - 1));
      const y = Math.floor(rand() * (TILE - 1));
      ctx.fillStyle = colours[i % colours.length];
      if (rand() < 0.5) ctx.fillRect(x, y, 2, 1);
      else ctx.fillRect(x, y, 1, 2);
    }
  };
}

/** Branching coral, transparent background (for a crossed-plane block). */
export function coral(color, seed = 65) {
  return (ctx) => {
    ctx.clearRect(0, 0, TILE, TILE);
    const c = typeof color === 'string' ? color : shade(color, 0);
    const branch = (x, y, h, light) => {
      ctx.fillStyle = light ? shade(c, 0.2) : c;
      ctx.fillRect(x, y, 2, h);
      ctx.fillStyle = shade(c, 0.35);
      ctx.fillRect(x, y, 2, 1);
    };
    branch(7, 6, 10, false);
    branch(3, 3, 7, true);
    branch(11, 2, 8, true);
    branch(5, 9, 2, false);
    ctx.fillStyle = c;
    ctx.fillRect(3, 9, 5, 2);
    ctx.fillRect(8, 9, 4, 2);
    branch(1, 6, 3, false);
    branch(13, 5, 3, false);
    ctx.fillRect(1, 8, 3, 1);
    ctx.fillRect(12, 7, 2, 1);
  };
}

/** Tall wavy seaweed, transparent background. */
export function seaweed(base, seed = 66) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.clearRect(0, 0, TILE, TILE);
    for (const x0 of [2, 7, 12]) {
      const top = Math.floor(rand() * 4);
      for (let y = TILE - 1; y >= top; y--) {
        const x = x0 + Math.round(Math.sin(y * 0.7 + x0) * 1.2);
        px(ctx, x, y, shade(base, (rand() - 0.5) * 0.25));
        px(ctx, x + 1, y, shade(base, -0.12));
      }
    }
  };
}

/** Shimmering pearl tiles. */
export function pearl(seed = 67) {
  return (ctx) => {
    const rand = makeRandom(seed);
    const tints = [0xf6eef2, 0xeaf3f6, 0xf3eefb, 0xfdf6e8];
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const tint = tints[gy * 2 + gx];
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const shine = (x + y < 5 ? 0.25 : 0) - (x + y > 11 ? 0.08 : 0);
            px(ctx, gx * 8 + x, gy * 8 + y, shade(tint, shine + (rand() - 0.5) * 0.04));
          }
        }
      }
    }
    ctx.fillStyle = shade(0xd8cfe0, -0.1);
    ctx.fillRect(0, 7, TILE, 1);
    ctx.fillRect(7, 0, 1, TILE);
  };
}

/** Loose golden straw. */
export function hay(seed = 68) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(0xd9b65a, (rand() - 0.5) * 0.12));
    }
    for (let i = 0; i < 22; i++) {
      const x = Math.floor(rand() * TILE);
      const y = Math.floor(rand() * TILE);
      const len = 2 + Math.floor(rand() * 4);
      const tone = rand() < 0.5 ? shade(0xd9b65a, 0.25) : shade(0xd9b65a, -0.25);
      for (let k = 0; k < len; k++) px(ctx, (x + k) % TILE, y, tone);
    }
    // Twine.
    ctx.fillStyle = '#8a5a36';
    ctx.fillRect(0, 4, TILE, 1);
    ctx.fillRect(0, 11, TILE, 1);
  };
}

/** A soft rug with paw prints on it. */
export function pawRug(base, paw, seed = 69) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(base, (rand() - 0.5) * 0.08));
    }
    ctx.fillStyle = paw;
    for (const [cx, cy] of [[4, 4], [11, 11]]) {
      ctx.fillRect(cx - 1, cy, 3, 2);
      ctx.fillRect(cx - 2, cy - 2, 1, 1);
      ctx.fillRect(cx, cy - 3, 1, 1);
      ctx.fillRect(cx + 2, cy - 2, 1, 1);
    }
  };
}

/** Rainbow bands, top to bottom. */
export function rainbow(seed = 70) {
  return (ctx) => {
    const rand = makeRandom(seed);
    const bands = [0xe85a5a, 0xf29a4a, 0xf2d04a, 0x6cc46a, 0x5a9ee8, 0x9a6ce0];
    for (let y = 0; y < TILE; y++) {
      const band = bands[Math.min(bands.length - 1, Math.floor(y / (TILE / bands.length)))];
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(band, (rand() - 0.5) * 0.06));
    }
  };
}

/** A puffy white cloud filling the block. */
export function cloud(seed = 71) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const shadowed = y > 11 ? -0.08 : 0;
        px(ctx, x, y, shade(0xf7f9ff, shadowed + (rand() - 0.5) * 0.03));
      }
    }
    ctx.fillStyle = '#dfe6f5';
    for (const [x, y, w] of [[1, 6, 5], [8, 3, 6], [3, 12, 7], [11, 10, 4]]) {
      ctx.fillRect(x, y, w, 1);
    }
  };
}

/** Sparkles in every colour on a soft lilac base. Glows. */
export function glitter(seed = 72) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(0xe9d8f7, (rand() - 0.5) * 0.08));
    }
    const colours = ['#ffffff', '#ffd1ea', '#c9f2ff', '#fff3a8', '#d8c2ff'];
    for (let i = 0; i < 14; i++) {
      const x = 1 + Math.floor(rand() * (TILE - 2));
      const y = 1 + Math.floor(rand() * (TILE - 2));
      ctx.fillStyle = colours[i % colours.length];
      ctx.fillRect(x, y, 1, 1);
      if (i % 3 === 0) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
  };
}

/** Deep blue night sky full of stars. Glows a little. */
export function starfield(seed = 73) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(0x1d2152, (rand() - 0.5) * 0.12));
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rand() * TILE);
      const y = Math.floor(rand() * TILE);
      px(ctx, x, y, rand() < 0.3 ? '#fff3b0' : '#ffffff');
    }
    // One bigger twinkle.
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(10, 4, 1, 3);
    ctx.fillRect(9, 5, 3, 1);
  };
}

/** Swirly banded planet surface. */
export function planet(seed = 74) {
  return (ctx) => {
    const rand = makeRandom(seed);
    const bands = [0xe9b07a, 0xf3dcb8, 0xd4895a, 0xf0c99a, 0xbf7550];
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const wobble = Math.sin(x * 0.55 + y * 0.3) * 1.2;
        const band = bands[Math.floor(((y + wobble + TILE) / 3.2)) % bands.length];
        px(ctx, x, y, shade(band, (rand() - 0.5) * 0.06));
      }
    }
    // A storm spot.
    ctx.fillStyle = '#b9583e';
    ctx.fillRect(9, 9, 4, 2);
    ctx.fillStyle = '#d8775a';
    ctx.fillRect(10, 9, 2, 1);
  };
}

/** Riveted metal panels. */
export function metalPanel(base, seed = 75) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const sheen = (x - y) / TILE * 0.12;
        px(ctx, x, y, shade(base, sheen + (rand() - 0.5) * 0.04));
      }
    }
    ctx.fillStyle = shade(base, -0.3);
    ctx.fillRect(0, 0, TILE, 1);
    ctx.fillRect(0, 0, 1, TILE);
    ctx.fillRect(0, 8, TILE, 1);
    ctx.fillStyle = shade(base, 0.3);
    for (const [x, y] of [[2, 2], [13, 2], [2, 10], [13, 10], [2, 14], [13, 14]]) {
      ctx.fillRect(x, y, 1, 1);
    }
  };
}

/** Big squared castle bricks. */
export function castleBrick(base, seed = 76) {
  return (ctx) => {
    const rand = makeRandom(seed);
    ctx.fillStyle = shade(base, -0.35);
    ctx.fillRect(0, 0, TILE, TILE);
    for (let row = 0; row < 3; row++) {
      const y = row * 5 + (row === 2 ? 1 : 0);
      const h = row === 2 ? 4 : 4;
      const offset = row % 2 === 0 ? 0 : -4;
      for (let x = offset; x < TILE; x += 8) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * 0.16);
        ctx.fillRect(x + 1, y + 1, 7, h);
        ctx.fillStyle = shade(base, 0.12);
        ctx.fillRect(x + 1, y + 1, 7, 1);
      }
    }
  };
}

/** Gold bars with a shine. */
export function gold(seed = 77) {
  return (ctx) => {
    const rand = makeRandom(seed);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(ctx, x, y, shade(0xe8b730, (rand() - 0.5) * 0.08));
    }
    ctx.fillStyle = shade(0xe8b730, -0.3);
    ctx.fillRect(0, 7, TILE, 1);
    ctx.fillRect(7, 0, 1, 7);
    ctx.fillRect(3, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);
    ctx.fillStyle = '#fff4c2';
    ctx.fillRect(2, 2, 3, 1);
    ctx.fillRect(2, 2, 1, 2);
    ctx.fillRect(10, 2, 2, 1);
    ctx.fillRect(6, 10, 3, 1);
  };
}

/** A wall torch: a stick with a flame, transparent background. Glows. */
export function torch(seed = 78) {
  return (ctx) => {
    ctx.clearRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(7, 7, 2, 9);
    ctx.fillStyle = '#4e3520';
    ctx.fillRect(7, 15, 2, 1);
    ctx.fillStyle = '#f08a2e';
    ctx.fillRect(6, 3, 4, 4);
    ctx.fillStyle = '#ffc94a';
    ctx.fillRect(7, 2, 2, 4);
    ctx.fillStyle = '#fff3c0';
    ctx.fillRect(7, 4, 2, 2);
  };
}

/** Turn a painter function into a nearest-filtered THREE texture. */
export function makeTexture(painter) {
  const { canvas, ctx } = newTile();
  painter(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Stack three painters (top / side / bottom) into one vertical atlas so a
 * multi-face block still renders as a single material and a single draw call.
 */
export function makeFaceAtlas(topPainter, sidePainter, bottomPainter) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE * 3;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const painters = [topPainter, sidePainter, bottomPainter];
  painters.forEach((painter, i) => {
    const tile = newTile();
    painter(tile.ctx);
    ctx.drawImage(tile.canvas, 0, i * TILE);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Soft grayscale noise reused (and tinted) across every character material. */
let clothNoise = null;
export function getClothNoise() {
  if (clothNoise) return clothNoise;
  const { canvas, ctx } = newTile();
  const rand = makeRandom(99);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const v = 226 + Math.floor(rand() * 29);
      px(ctx, x, y, `rgb(${v},${v},${v})`);
    }
  }
  clothNoise = new THREE.CanvasTexture(canvas);
  clothNoise.magFilter = THREE.NearestFilter;
  clothNoise.minFilter = THREE.NearestFilter;
  clothNoise.colorSpace = THREE.SRGBColorSpace;
  return clothNoise;
}

export { TILE };
