/**
 * Offline support for Learn Thai. Audio clips and photos are named by content
 * hash, so they're safe to keep forever: cache-first. Pages and manifests
 * change between deploys: network-first, cache as fallback.
 */
const CACHE = 'learn-thai-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const changing = req.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest');
  if (changing) {
    event.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req)),
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
