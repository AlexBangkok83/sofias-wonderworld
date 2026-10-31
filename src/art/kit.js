/**
 * The drawing kit. Every picture in the game — people, furniture, houses — is
 * an SVG string built from these few helpers, so the whole game ships as code
 * with no image files, stays sharp at any size, and shares one look:
 * flat bright colours, round corners, and a soft dark outline.
 *
 * No DOM in here, so the pictures can be built (and checked) in Node too.
 */

export const INK = '#3b2f45';      // the outline colour on everything
export const LINE = 3;              // outline width, in world units

/** Lighten (amount > 0) or darken (amount < 0) a '#rrggbb' colour. */
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const target = amount >= 0 ? 255 : 0;
  const t = Math.abs(amount);
  r = Math.round(r + (target - r) * t);
  g = Math.round(g + (target - g) * t);
  b = Math.round(b + (target - b) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function attrs(fill, o = {}) {
  const stroke = o.stroke === undefined ? INK : o.stroke;
  const sw = o.sw === undefined ? LINE : o.sw;
  let out = ` fill="${fill}"`;
  if (stroke && sw) out += ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  if (o.opacity !== undefined) out += ` opacity="${o.opacity}"`;
  if (o.extra) out += ` ${o.extra}`;
  return out;
}

/** Rounded rectangle. */
export const rr = (x, y, w, h, r, fill, o) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"${attrs(fill, o)}/>`;
/** Circle. */
export const circ = (cx, cy, r, fill, o) => `<circle cx="${cx}" cy="${cy}" r="${r}"${attrs(fill, o)}/>`;
/** Ellipse. */
export const ell = (cx, cy, rx, ry, fill, o) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${attrs(fill, o)}/>`;
/** Any path. */
export const path = (d, fill, o) => `<path d="${d}"${attrs(fill, o)}/>`;
/** A line or polyline with no fill. */
export const line = (d, color = INK, sw = LINE) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** Detail with no outline — highlights, patterns, shadows. */
export const flat = { stroke: null };
export const thin = { sw: 2 };

/** A group, optionally transformed. */
export const g = (inner, transform = '') =>
  (transform ? `<g transform="${transform}">${inner}</g>` : `<g>${inner}</g>`);

/** Wrap drawing code in an <svg> sized to its box. */
export function svg(w, h, inner, { viewBox = `0 0 ${w} ${h}`, cls = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"`
    + `${cls ? ` class="${cls}"` : ''} overflow="visible">${inner}</svg>`;
}

/** A five-pointed star path centred on (cx, cy). */
export function starPath(cx, cy, outer, inner = outer * 0.48) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}

/** A heart path, centred on (cx, cy), roughly `s` wide. */
export function heartPath(cx, cy, s) {
  const k = s / 2;
  return `M${cx} ${cy + k * 0.9}C${cx - k * 1.4} ${cy - k * 0.1} ${cx - k * 0.7} ${cy - k * 1.2} ${cx} ${cy - k * 0.45}`
    + `C${cx + k * 0.7} ${cy - k * 1.2} ${cx + k * 1.4} ${cy - k * 0.1} ${cx} ${cy + k * 0.9}Z`;
}

/** Small deterministic random numbers, so a pattern looks the same every time. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
