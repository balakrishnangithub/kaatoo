/// Kaatoo service worker — offline-first by design.
///
/// Why this exists: Kaatoo is for little children, often on tablets with flaky
/// or no internet. Everything the app needs (app shell, self-hosted fonts) is
/// precached on first visit; afterwards the app opens instantly, fully offline.
///
/// Privacy: nothing is ever sent anywhere. This worker only *reads* from this
/// origin and stores responses in the browser's Cache Storage on-device.
///
/// Strategy:
///   - install: precache the app shell (build-hashed assets → safe forever)
///   - activate: delete caches from older versions
///   - fetch, same-origin GET: cache-first (all precached assets are
///     content-hashed, so stale entries are impossible), network fallback for
///     anything not precached
///   - SPA navigations: network-first, falling back to the cached shell

const VERSION = 'v1';
const PRECACHE = `kaatoo-precache-${VERSION}`;
const RUNTIME = `kaatoo-runtime-${VERSION}`;

// Stable public/ assets, relative so the app works from any base path
// (GitHub Pages sub-folder included). Hashed build assets are fetched from
// the generated sw-assets.js at install time.
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'fonts/kavivanar-tamil.woff2',
  'fonts/andika-latin.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const buildAssets = await fetch('sw-assets.js')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
      const cache = await caches.open(PRECACHE);
      await cache.addAll([...STATIC_ASSETS, ...buildAssets]);
      // No skipWaiting on purpose: a child may be mid-activity. The new worker
      // takes over when all tabs close — calm beats clever here.
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE, RUNTIME]);
      for (const key of await caches.keys()) {
        if (!keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const fontOrigin =
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';

  if (!sameOrigin && !fontOrigin) return; // never touch anything else

  // SPA navigation: try network (fresh content), fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PRECACHE).then((c) => c.put('index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match('index.html', { ignoreSearch: true })
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // Everything else: cache-first, then network (remembered for offline).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            const store = sameOrigin ? PRECACHE : RUNTIME; // fonts go runtime-side
            caches.open(store).then((c) => c.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
