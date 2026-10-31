import { drawThing } from '../art/things.js';
import { svg } from '../art/kit.js';
import { drawPerson } from '../art/person.js';

/** Small helper — build an element from a tag, props and children. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

let thumbCount = 0;

/** A thing's picture, sized to fit a small square (the drawer, the shop). */
export function thingThumb(def) {
  thumbCount += 1;
  const node = el('span', { class: 'thumb', title: def.label });
  const pad = 8;
  node.innerHTML = svg(def.w, def.h, drawThing(def, def.toggle && def.startsOn ? { on: true } : {}, `th${thumbCount}`), {
    viewBox: `${-pad} ${-pad} ${def.w + pad * 2} ${def.h + pad * 2}`,
  });
  return node;
}

/** A person's picture, head and body, for the drawer and character list. */
export function personThumb(cfg) {
  const node = el('span', { class: 'thumb person-thumb' });
  node.innerHTML = drawPerson(cfg).replace(/viewBox="[^"]*"/, 'viewBox="-62 -200 124 210"');
  return node;
}

/**
 * A button for something that can't be undone: the first tap says what will
 * happen, a second tap within a few seconds does it. (Browser confirm()
 * pop-ups don't show everywhere this runs — on claude.ai they're refused.)
 */
export function twoTapButton({ id, cls = 'btn danger small', label, armedLabel, onConfirm }) {
  let timer = null;
  const btn = el('button', {
    id, class: cls,
    onclick: () => {
      if (btn.dataset.armed === 'true') {
        clearTimeout(timer);
        btn.dataset.armed = 'false';
        btn.textContent = label;
        onConfirm();
        return;
      }
      btn.dataset.armed = 'true';
      btn.textContent = armedLabel;
      timer = setTimeout(() => {
        btn.dataset.armed = 'false';
        btn.textContent = label;
      }, 4000);
    },
  }, label);
  return btn;
}
