// ─── EPS Tracker — Service Worker v7 ─────────────────────────────────────────
// Stratégie : Cache-First strict pour fonctionnement 100% offline sur iOS Safari
const CACHE = 'eps-tracker-v7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
];

// ── Installation : mise en cache immédiate ────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      )
    )
  );
});

// ── Activation : suppression des anciens caches ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch : Cache-First — répond toujours depuis le cache si disponible ───────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        if (cached) {
          // Mise à jour silencieuse en arrière-plan
          fetch(e.request)
            .then(fresh => { if (fresh && fresh.ok) cache.put(e.request, fresh.clone()); })
            .catch(() => {});
          return cached;
        }
        return fetch(e.request)
          .then(response => {
            if (response && response.ok) cache.put(e.request, response.clone());
            return response;
          })
          .catch(() => caches.match('./index.html') || caches.match('./'));
      })
    )
  );
});
