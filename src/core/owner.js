/**
 * The owner's password: the 🔒 button asks for it, and the right word turns
 * on owner commands (src/ui/owner.js) on that device.
 *
 * Only a scrambled fingerprint of the password is kept here, never the word
 * itself, so it can't be read out of the game's code (the built game is a
 * public web page). Capitals, spaces and punctuation don't matter.
 *
 * To change the password, run
 *   node -e "import('./src/core/owner.js').then(m => console.log(m.fingerprint('new password')))"
 * and put what it prints in OWNER_FINGERPRINT.
 *
 * This keeps the owner commands away from other children playing on the
 * same device; it isn't meant to stand up to someone determined. There's no
 * server and nothing else it could protect.
 */

const OWNER_FINGERPRINT = '8aa58098';

/** Just the letters, in capitals: "Open sesame!" and "OPENSESAME" are the same. */
function normalise(word) {
  return String(word ?? '').toUpperCase().replace(/[^A-Z]/g, '');
}

/** FNV-1a: a short, stable fingerprint of a word. */
export function fingerprint(word) {
  let hash = 0x811c9dc5;
  for (const ch of normalise(word)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function isOwnerPassword(word) {
  return normalise(word).length > 0 && fingerprint(word) === OWNER_FINGERPRINT;
}
