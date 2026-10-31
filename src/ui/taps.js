/**
 * Make sure a finger tap on a button always counts.
 *
 * After a touch drag on the dollhouse, Chrome now and then gets the touch
 * and the lift on a button but never turns them into a click — so the
 * button does nothing. A child just sees a button that didn't work. This
 * watches for a clean tap (finger down and up on the same button without
 * moving) and, if no click follows shortly after, presses the button itself.
 * When the browser's own click does arrive, this does nothing, so a button is
 * never pressed twice.
 */

const MOVE_SLOP = 12;        // pixels: further than this is a drag, not a tap
const MAX_TAP_MS = 800;
const CLICK_WAIT_MS = 450;   // how long to wait for the browser's own click

export function installTapFallback(root = document) {
  let pending = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    const button = e.target.closest?.('button');
    pending = button ? { button, x: e.clientX, y: e.clientY, id: e.pointerId, t: Date.now() } : null;
  }, true);
  root.addEventListener('pointerup', (e) => {
    if (!pending || e.pointerId !== pending.id) return;
    const { button, x, y, t } = pending;
    pending = null;
    if (Math.hypot(e.clientX - x, e.clientY - y) > MOVE_SLOP || Date.now() - t > MAX_TAP_MS) return;
    if (e.target.closest?.('button') !== button) return;
    let clicked = false;
    const sawClick = () => { clicked = true; };
    button.addEventListener('click', sawClick, { capture: true, once: true });
    setTimeout(() => {
      button.removeEventListener('click', sawClick, { capture: true });
      if (!clicked && button.isConnected && !button.disabled) button.click();
    }, CLICK_WAIT_MS);
  }, true);
  root.addEventListener('pointercancel', () => { pending = null; }, true);
}
