// ─── EPS Tracker — Service Worker ────────────────────────────────────────────
const CACHE = 'eps-tracker-v5';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-57x57.png',
  './icons/icon-60x60.png',
  './icons/icon-72x72.png',
  './icons/icon-76x76.png',
  './icons/icon-114x114.png',
  './icons/icon-120x120.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-167x167.png',
  './icons/icon-180x180.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-32x32.png',
  './icons/icon-16x16.png',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Cache échoué :', url, err))
        )
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;
  if (e.request.url.startsWith('moz-extension://')) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        if (cached) {
          fetch(e.request)
            .then(fresh => { if (fresh && fresh.ok) cache.put(e.request, fresh.clone()); })
            .catch(() => {});
          return cached;
        }
        return fetch(e.request).then(fresh => {
          if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
          return fresh;
        }).catch(() => caches.match('./index.html'));
      })
    )
  );
});
