import { getBlockRender } from '../world/blocks.js';

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

/** Turn a block's procedural texture into an <img>-able data URL. */
const iconCache = new Map();
export function blockIcon(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const render = getBlockRender(id);
  let url = '';
  try {
    // Multi-face blocks are a 1×3 atlas; the side is the most recognisable.
    const image = render.material.map.image;
    if (image.height > image.width) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.width;
      canvas.getContext('2d').drawImage(
        image, 0, image.width, image.width, image.width, 0, 0, image.width, image.width,
      );
      url = canvas.toDataURL();
    } else {
      url = image.toDataURL();
    }
  } catch {
    url = '';
  }
  iconCache.set(id, url);
  return url;
}
