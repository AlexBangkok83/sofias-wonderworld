/**
 * Hash routes: #/, #/chapter/farm, #/play/farm/memory, …
 * A handler renders into the app root and may return a cleanup function
 * (games use it to stop animation loops and audio).
 */

const routes = [];
let cleanup = null;
let root = null;

export function route(pattern, handler) {
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, '([^/]+)')}$`);
  routes.push([re, handler]);
}

export function go(path) {
  if (location.hash === `#${path}`) render();
  else location.hash = path;
}

function render() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  const path = location.hash.slice(1).split('?')[0] || '/';
  for (const [re, handler] of routes) {
    const m = path.match(re);
    if (m) {
      const screen = document.createElement('div');
      screen.className = 'screen';
      root.replaceChildren(screen);
      window.scrollTo(0, 0);
      cleanup = handler(screen, ...m.slice(1).map(decodeURIComponent));
      return;
    }
  }
  go('/');
}

export function startRouter(el) {
  root = el;
  window.addEventListener('hashchange', render);
  render();
}
