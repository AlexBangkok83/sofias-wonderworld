import {
  INK, shade, rr, circ, ell, path, line, flat, thin, svg, starPath, heartPath, seeded,
} from './kit.js';
import { WORLD_H } from '../world/physics.js';

/**
 * The backdrop for each place: sky, ground, and the cut-open building with
 * its wallpaper, floors and windows. Things and people are drawn on top of
 * this by the stage; nothing here can be picked up.
 */

const FONT = 'font-family="ui-rounded, \'SF Pro Rounded\', system-ui, sans-serif" font-weight="800"';

const FLOORS = {
  wood: '#c98b55',
  tile: '#eef0f2',
  carpet: '#b8a3dd',
  stone: '#b9b6ae',
  hay: '#e8c46a',
  moon: '#ece6fa',
};

// ---------------------------------------------------------------------------
// Sky and ground
// ---------------------------------------------------------------------------

function sky(place) {
  const { w } = place;
  if (place.sky === 'night') {
    const rand = seeded(11);
    let stars = '';
    for (let i = 0; i < Math.round(w / 9); i++) {
      const x = rand() * w;
      const y = rand() * 700;
      const r = 1 + rand() * 2;
      stars += rand() < 0.12 ? path(starPath(x, y, r * 3), '#fff6c8', flat) : circ(x, y, r, '#ffffff', { stroke: null, opacity: 0.8 });
    }
    return `<defs><linearGradient id="sky-${place.id}" x1="0" y1="0" x2="0" y2="1">`
      + '<stop offset="0" stop-color="#17142f"/><stop offset="1" stop-color="#3d2f6b"/></linearGradient></defs>'
      + `<rect width="${w}" height="${WORLD_H}" fill="url(#sky-${place.id})"/>${stars}`;
  }
  const rand = seeded(5);
  let clouds = '';
  for (let x = 120; x < w; x += 420 + rand() * 260) {
    const y = 60 + rand() * 90;
    clouds += path(`M${x} ${y + 30} q-34 0 -30 -22 q6 -26 36 -18 q12 -26 44 -16 q30 -6 36 22 q26 6 14 34 Z`,
      '#ffffff', { stroke: null, opacity: 0.9 });
  }
  return `<defs><linearGradient id="sky-${place.id}" x1="0" y1="0" x2="0" y2="1">`
    + '<stop offset="0" stop-color="#9fd8f7"/><stop offset="1" stop-color="#fdf0dc"/></linearGradient></defs>'
    + `<rect width="${w}" height="${WORLD_H}" fill="url(#sky-${place.id})"/>`
    + circ(w - 160, 110, 46, '#ffe08a', { stroke: null }) + circ(w - 160, 110, 64, '#ffe08a', { stroke: null, opacity: 0.3 })
    + clouds;
}

function hills(place) {
  const { w, ground } = place;
  let d = `M0 ${ground}`;
  for (let x = 0; x <= w; x += 300) d += ` Q${x + 150} ${ground - 140 - (x % 600 ? 40 : 0)} ${x + 300} ${ground}`;
  return path(`${d} L${w} ${ground} Z`, '#a6dca0', { stroke: null })
    + path(`M0 ${ground} ${Array.from({ length: Math.ceil(w / 220) }, (_, i) => `Q${i * 220 + 110} ${ground - 70} ${i * 220 + 220} ${ground}`).join(' ')} Z`,
      '#8fd08a', { stroke: null });
}

function groundStrip(place) {
  const { w, ground } = place;
  const night = place.sky === 'night';
  return rr(-10, ground, w + 20, WORLD_H - ground + 20, 0, night ? '#2d2650' : '#86c96f', { stroke: null })
    + rr(-10, ground, w + 20, 8, 0, night ? '#3d3468' : '#74b85e', { stroke: null });
}

// ---------------------------------------------------------------------------
// Wallpaper
// ---------------------------------------------------------------------------

function pattern(id, kind, paper) {
  const ink = shade(paper, -0.08);
  const shapes = {
    dots: [40, circ(10, 10, 4, ink, flat) + circ(30, 30, 4, ink, flat)],
    stripes: [40, rr(0, 0, 14, 40, 0, ink, flat)],
    hearts: [48, path(heartPath(12, 14, 12), ink, flat) + path(heartPath(36, 38, 12), ink, flat)],
    tiles: [36, `<path d="M0 0 H36 V36" fill="none" stroke="${ink}" stroke-width="3"/>`],
    stars: [56, path(starPath(14, 14, 6), shade(paper, 0.25), flat) + path(starPath(42, 40, 4), shade(paper, 0.2), flat)],
    bricks: [48, `<path d="M0 0 H48 M0 24 H48 M24 0 V24 M0 24 V48" fill="none" stroke="${ink}" stroke-width="3"/>`],
    planks: [44, rr(0, 0, 3, 44, 0, shade(paper, -0.18), flat)],
  };
  const entry = shapes[kind];
  if (!entry) return { defs: '', fill: paper };
  const [size, inner] = entry;
  return {
    defs: `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">`
      + `<rect width="${size}" height="${size}" fill="${paper}"/>${inner}</pattern>`,
    fill: `url(#${id})`,
  };
}

function windowAt(x, y, w = 120, night = false) {
  const h = 116;
  return rr(x - w / 2 - 8, y - 8, w + 16, h + 16, 12, '#ffffff')
    + rr(x - w / 2, y, w, h, 6, night ? '#3d2f6b' : '#bfe6fb', flat)
    + (night ? circ(x + w / 4, y + 28, 10, '#fff3c0', flat) : circ(x - w / 4, y + 34, 18, '#ffffff', { stroke: null, opacity: 0.8 }))
    + line(`M${x} ${y} L${x} ${y + h} M${x - w / 2} ${y + h / 2} L${x + w / 2} ${y + h / 2}`, '#ffffff', 6)
    + path(`M${x - w / 2 - 14} ${y - 12} Q${x - w / 2 + 10} ${y + 60} ${x - w / 2 - 6} ${y + h + 10} L${x - w / 2 - 22} ${y + h + 10} L${x - w / 2 - 22} ${y - 12} Z`, '#f49ab8')
    + path(`M${x + w / 2 + 14} ${y - 12} Q${x + w / 2 - 10} ${y + 60} ${x + w / 2 + 6} ${y + h + 10} L${x + w / 2 + 22} ${y + h + 10} L${x + w / 2 + 22} ${y - 12} Z`, '#f49ab8');
}

function rooms(place) {
  let defs = '';
  let out = '';
  place.rooms.forEach((r, i) => {
    const p = pattern(`pat-${place.id}-${i}`, r.pattern, r.paper);
    defs += p.defs;
    out += rr(r.x + 7, r.y + 7, r.w - 14, r.h - 7, 4, p.fill, { stroke: null });
    // A soft shadow along the ceiling so the rooms read as boxes.
    out += rr(r.x + 7, r.y + 7, r.w - 14, 16, 0, '#000000', { stroke: null, opacity: 0.06 });
    for (const [x, y, w] of r.windows || []) out += windowAt(x, y, w, place.sky === 'night');
    const floor = FLOORS[r.floor] || FLOORS.wood;
    out += rr(r.x, r.y + r.h, r.w, 20, 3, floor);
    if (r.floor === 'wood') {
      for (let x = r.x + 40; x < r.x + r.w; x += 70) out += line(`M${x} ${r.y + r.h + 4} L${x} ${r.y + r.h + 16}`, shade(floor, -0.25), 2);
    }
  });
  return `<defs>${defs}</defs>${out}`;
}

// ---------------------------------------------------------------------------
// Buildings, cut open
// ---------------------------------------------------------------------------

function shell(place) {
  const b = place.building;
  const top = Math.min(...place.rooms.map((r) => r.y));
  const bottom = place.ground;
  const x0 = b.x0 - 14;
  const x1 = b.x1 + 14;
  let roof = '';
  if (b.roof === 'gable') {
    const mid = (x0 + x1) / 2;
    roof = path(`M${x0 - 40} ${top - 4} L${mid} ${Math.max(6, top - 120)} L${x1 + 40} ${top - 4} Z`, b.roofColor)
      + rr(x1 - 220, top - 110, 50, 80, 4, shade(b.roofColor, -0.2));
  } else if (b.roof === 'flat') {
    roof = rr(x0 - 30, top - 44, x1 - x0 + 60, 40, 8, b.roofColor);
  } else if (b.roof === 'barn') {
    const mid = (x0 + x1) / 2;
    roof = path(`M${x0 - 40} ${top - 4} L${x0 + 60} ${top - 90} L${mid} ${Math.max(6, top - 124)} L${x1 - 60} ${top - 90} L${x1 + 40} ${top - 4} Z`, b.roofColor);
  }
  return roof + rr(x0, top - 6, x1 - x0, bottom - top + 6, 6, b.wall);
}

function exitDoorArt(link, night) {
  const { x, y, w, h } = link;
  return rr(x - 6, y - 6, w + 12, h + 6, 10, night ? '#8e7cc3' : '#95603a')
    + rr(x, y, w, h, 6, night ? '#1e1a3d' : '#bfe6fb', flat)
    + rr(x, y + h - 30, w, 30, 0, night ? '#3d3468' : '#86c96f', flat)
    + path(`M${x + w / 2 + 16} ${y + 70} L${x + w / 2 - 12} ${y + 70} M${x + w / 2 - 2} ${y + 58} L${x + w / 2 - 14} ${y + 70} L${x + w / 2 - 2} ${y + 82}`,
      'none', { stroke: '#ffffff', sw: 7 });
}

function interior(place) {
  const exits = place.links.filter((l) => l.kind === 'exit').map((l) => exitDoorArt(l, place.sky === 'night')).join('');
  return shell(place) + rooms(place) + exits;
}

function moonHouse(place) {
  const cx = 750;
  const cy = 440;
  const r = 380;
  let craters = '';
  for (const [x, y, s] of [[480, 180, 26], [1040, 300, 34], [470, 640, 30], [1010, 680, 22], [760, 90, 18]]) {
    craters += circ(x, y, s, '#d6cfec', { stroke: null });
  }
  const vines = [560, 640, 780, 900].map((x, i) => line(`M${x} 337 Q${x + (i % 2 ? 10 : -10)} 380 ${x} ${410 + i * 14}`, '#5fae62', 5)
    + circ(x, 410 + i * 14, 6, '#5fae62', flat)).join('');
  let lanterns = '';
  for (let x = 1140; x < 1380; x += 60) {
    lanterns += circ(x, 728, 10, '#fff1b8', { stroke: null, opacity: 0.5 }) + circ(x, 728, 5, '#fff6d0', flat);
  }
  return `<defs><clipPath id="moon-clip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`
    + circ(cx, cy, r + 30, '#f4efff', { stroke: null, opacity: 0.12 })
    + circ(cx, cy, r, '#f2eefb') + craters
    + `<g clip-path="url(#moon-clip)">${circ(cx + 230, cy - 120, r, '#2b2350', { stroke: null, opacity: 0.55 })}</g>`
    + circ(cx, cy, r, 'none')
    + rooms(place) + vines
    + rr(1080, place.ground - 6, 420, 14, 7, '#ece6fa', { stroke: null }) + lanterns
    + place.links.map((l) => exitDoorArt(l, true)).join('');
}

// ---------------------------------------------------------------------------
// The street
// ---------------------------------------------------------------------------

function sign(cx, y, text, color) {
  const w = text.length * 15 + 34;
  return rr(cx - w / 2, y, w, 40, 12, color) + `<text x="${cx}" y="${y + 28}" text-anchor="middle" font-size="22" ${FONT} fill="#ffffff">${text}</text>`;
}

function facadeDoor(cx, bottom, color = '#95603a') {
  return rr(cx - 34, bottom - 110, 68, 110, 30, color) + circ(cx + 18, bottom - 52, 5, '#f6c94e', thin);
}

function facades(place) {
  const L = Object.fromEntries(place.links.map((l) => [l.to, l]));
  const g = place.ground;
  let out = '';

  let b = L.cottage;
  out += path(`M${b.x - 20} ${b.y + 90} L${b.x + b.w / 2} ${b.y - 10} L${b.x + b.w + 20} ${b.y + 90} Z`, '#c0395b')
    + rr(b.x, b.y + 84, b.w, g - b.y - 84, 6, '#f6ead3')
    + windowAt(b.x + 70, b.y + 130, 80) + windowAt(b.x + b.w - 70, b.y + 130, 80)
    + facadeDoor(b.x + b.w / 2, g) + sign(b.x + b.w / 2, b.y + 34, 'Cottage', '#c0395b');

  b = L.modern;
  out += rr(b.x, b.y, b.w, g - b.y, 6, '#eef1f7') + rr(b.x - 16, b.y - 24, b.w + 32, 30, 6, '#5a4d6b')
    + rr(b.x + 30, b.y + 40, 150, 120, 6, '#bfe6fb') + rr(b.x + 200, b.y + 40, 150, 120, 6, '#bfe6fb')
    + rr(b.x + 210, b.y + 200, 140, g - b.y - 200, 6, '#bfe6fb') + facadeDoor(b.x + 100, g, '#5a4d6b')
    + sign(b.x + 280, b.y + 168, 'Modern House', '#5f9ce6');

  b = L.bakery;
  out += path(`M${b.x - 20} ${b.y + 70} L${b.x + b.w / 2} ${b.y - 10} L${b.x + b.w + 20} ${b.y + 70} Z`, '#8a5a35')
    + rr(b.x, b.y + 64, b.w, g - b.y - 64, 6, '#fbe2c9');
  for (let i = 0; i < 6; i++) {
    out += rr(b.x - 10 + i * ((b.w + 20) / 6), b.y + 124, (b.w + 20) / 6, 44, 0, i % 2 ? '#ffffff' : '#f28fac', thin);
  }
  out += windowAt(b.x + 80, g - 128, 100) + facadeDoor(b.x + b.w - 80, g)
    + sign(b.x + b.w / 2, b.y + 76, 'Bakery', '#e2554f');

  b = L.barn;
  out += path(`M${b.x - 20} ${b.y + 110} L${b.x + 60} ${b.y + 20} L${b.x + b.w / 2} ${b.y - 10} L${b.x + b.w - 60} ${b.y + 20} L${b.x + b.w + 20} ${b.y + 110} Z`, '#8a3a35')
    + rr(b.x, b.y + 100, b.w, g - b.y - 100, 6, '#d9584f')
    + rr(b.x + b.w / 2 - 80, g - 170, 160, 170, 6, '#ffffff')
    + line(`M${b.x + b.w / 2 - 80} ${g - 170} L${b.x + b.w / 2 + 80} ${g} M${b.x + b.w / 2 + 80} ${g - 170} L${b.x + b.w / 2 - 80} ${g}`, '#d9584f', 8)
    + circ(b.x + b.w / 2, b.y + 70, 26, '#ffffff') + sign(b.x + b.w / 2, b.y + 120, 'Animal Barn', '#8a3a35');

  b = L.library;
  out += path(`M${b.x - 20} ${b.y + 80} L${b.x + b.w / 2} ${b.y} L${b.x + b.w + 20} ${b.y + 80} Z`, '#3e5187')
    + rr(b.x, b.y + 74, b.w, g - b.y - 74, 6, '#cdd8ee');
  for (const dx of [40, 110, b.w - 130, b.w - 60]) out += rr(b.x + dx, b.y + 130, 26, g - b.y - 130, 6, '#ffffff');
  out += facadeDoor(b.x + b.w / 2, g, '#3e5187') + sign(b.x + b.w / 2, b.y + 82, 'Library', '#3e5187');

  // The pond, in the grass in front of the street.
  out += ell(1720, 760, 170, 26, '#7cc8ec') + ell(1680, 756, 60, 8, '#bfe6fb', flat);

  // The hedge at the end of the street, with its one gap.
  const gap = L.moon;
  const hedge = (x0, x1) => {
    let h = rr(x0, gap.y + 10, x1 - x0, g - gap.y - 10, 30, '#4f9a55');
    for (let x = x0 + 30; x < x1 - 10; x += 60) h += circ(x, gap.y + 20, 34, '#5fae62', { stroke: null });
    return h;
  };
  out += hedge(2920, gap.x) + hedge(gap.x + gap.w, place.w + 40);
  out += rr(gap.x, gap.y + 40, gap.w, g - gap.y - 40, 10, '#2b2350', flat)
    + circ(gap.x + gap.w / 2, gap.y + 90, 6, '#fff6c8', flat) + circ(gap.x + 20, gap.y + 130, 3, '#ffffff', flat);
  // A trail of little lanterns leading to it — the only signpost.
  for (let x = 2880; x < gap.x; x += 46) {
    out += line(`M${x} ${g} L${x} ${g - 26}`, INK, 3) + circ(x, g - 32, 9, '#ffe08a', thin)
      + circ(x, g - 32, 18, '#ffe08a', { stroke: null, opacity: 0.25 });
  }
  return out;
}

function street(place) {
  return rr(-10, place.ground - 10, place.w + 20, 22, 0, '#e9dccb', { stroke: null })
    + rr(-10, place.ground + 10, place.w + 20, 6, 0, '#d2c2ad', { stroke: null });
}

/** The whole backdrop for a place, as an <svg> string. */
export function drawBackdrop(place) {
  let inner = sky(place);
  if (place.id === 'town') {
    inner += hills(place) + groundStrip(place) + facades(place) + street(place);
  } else if (place.building?.roof === 'moon') {
    inner += groundStrip(place) + moonHouse(place);
  } else {
    inner += hills(place) + groundStrip(place) + interior(place);
  }
  return svg(place.w, WORLD_H, inner, { cls: 'backdrop-svg' });
}
