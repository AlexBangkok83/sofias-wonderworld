/** Tiny DOM helpers. No framework: screens are rebuilt on navigation. */

import { decoFile } from '../data/deco.js';

/**
 * h('button', { class: 'btn', onClick: fn }, 'Label', childNode)
 * Props starting with "on" become listeners; `style` may be an object; null,
 * undefined and false children are skipped.
 */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith('--')) el.style.setProperty(k, v);
        else el.style[k] = v;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'html') el.innerHTML = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

/** A Fluent 3D emoji from public/thai/deco/, for decoration only. */
export function deco(emoji, cls = '') {
  return h('img', { class: `deco ${cls}`, src: `deco/${decoFile(emoji)}`, alt: '', draggable: 'false' });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

/** Restart a CSS animation class on an element. */
export function flash(el, cls, ms = 600) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

/** A short message that slides up from the bottom and fades. */
export function toast(text) {
  const el = h('div', { class: 'toast' }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2700);
}
