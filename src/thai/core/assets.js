/**
 * Where the app's files (pictures, voice clips, manifests) come from.
 *
 * Normally they sit next to the page: img/…, audio/…, deco/…. In the
 * single-page test copy (scripts/build-thai-artifact.mjs) they are embedded
 * in window.__THAI_FILES instead, as data: URLs (and JSON as text), because
 * that copy runs where only one page and a few scripts can be published.
 */

const embedded = () => window.__THAI_FILES;

/** True in the single-page test copy. */
export const isBundled = () => Boolean(embedded());

/** URL for a file such as "img/farm-cat-1234.webp". */
export const assetUrl = (path) => embedded()?.[path] || path;

/** Reads a JSON file such as "audio/manifest.json"; null if it isn't there. */
export async function loadJson(path) {
  const files = embedded();
  if (files) return files[path] ? JSON.parse(files[path]) : null;
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
