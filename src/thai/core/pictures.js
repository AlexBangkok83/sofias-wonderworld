/**
 * The picture for a word, plus its spelling label.
 *
 *  - Most words: a real photo from img/ (curated by scripts/thai-photos.mjs).
 *  - Colours: a paint swatch, because a photo can't say "red" without also
 *    saying "apple".
 *  - Numbers: counted dots with the digit and the Thai numeral.
 *  - A word whose photo isn't in yet: a plain card with the English word,
 *    so nothing is ever blank.
 */

import { h } from './dom.js';
import { settings } from './state.js';

let photos = {};

export async function loadPictures() {
  try {
    const res = await fetch('img/manifest.json', { cache: 'no-cache' });
    if (res.ok) photos = (await res.json()).photos || {};
  } catch { /* no photos yet */ }
}

export const photoCount = () => Object.keys(photos).length;
export const photoCredit = (id) => photos[id];

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
export const thaiNumeral = (n) => String(n).replace(/\d/g, (d) => THAI_DIGITS[d]);

/** The picture alone, filling its box. */
export function picture(word) {
  if (word.swatch) {
    return h('div', { class: 'pic pic-swatch', style: { '--swatch': word.swatch } }, h('span', { class: 'blob' }));
  }
  if (word.n != null) {
    const dots = Array.from({ length: word.n }, () => h('span', { class: 'dot' }));
    return h('div', { class: 'pic pic-number' },
      h('div', { class: 'num-digits' }, h('b', null, String(word.n)), h('i', null, thaiNumeral(word.n))),
      word.n > 0 ? h('div', { class: `num-dots n${word.n}` }, dots) : h('div', { class: 'num-zero' }, 'none'));
  }
  const photo = photos[word.id];
  if (photo) {
    return h('div', { class: 'pic pic-photo' },
      h('img', { src: `img/${photo.file}`, alt: word.en, loading: 'lazy', draggable: 'false' }));
  }
  return h('div', { class: 'pic pic-placeholder' }, h('span', null, word.en));
}

/** The spelling: Thai, pronunciation (if on), English (if on). */
export function label(word, { english = settings().english } = {}) {
  return h('div', { class: 'label' },
    h('div', { class: 'th' }, word.th),
    settings().roman ? h('div', { class: 'rom' }, word.rom) : null,
    english ? h('div', { class: 'en' }, word.en) : null);
}

/** Picture with its spelling underneath: how every word is shown when it isn't the question. */
export function card(word, opts = {}) {
  return h('div', { class: `word-card ${opts.class || ''}` }, picture(word), label(word, opts));
}
