/// Kaatoo service worker — offline-first by design.
///
/// Why this exists: Kaatoo is for little children, often on tablets with flaky
/// or no internet. Everything the app ships (app shell, bundles, self-hosted
/// fonts, icons) is precached on first visit; afterwards it works fully offline.
///
/// Privacy: nothing is ever sent anywhere. This worker only *reads* from this
/// origin (and the two Google Fonts hosts the page already uses) and stores
/// the responses in the browser's Cache Storage on-device.
///
/// Strategy:
///   - install: precache every file of THIS build into a cache named after it
///   - activate: delete Kaatoo's caches from older builds
///   - navigations: network-first (fresh when online), falling back to this
///     build's own shell — the shell and its bundles always come from one build
///   - same-origin GET: this build's precache, then the network
///   - Google Fonts: cache-first, in a cache that outlives builds

// Filled in by the build (vite-plugin-sw.ts): a fingerprint of everything in
// dist/, and the list of those files. Any change to any shipped file changes
// this line — which is what makes browsers install the new worker and drop the
// old cache. Nothing to bump by hand.
const BUILD = { version: 'dev', files: [] };

// Every cache this app owns starts with the prefix. On a shared origin
// (user.github.io/…) the other apps' caches are not ours to delete.
const PREFIX = 'kaatoo-';
const PRECACHE = `${PREFIX}precache-${BUILD.version}`;
const FONTS = `${PREFIX}fonts`;
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Bundles under assets/ are content-hashed, so any copy of one is the
      // right copy. Everything else keeps its name between builds — those are
      // fetched past the HTTP cache, or a stale copy could be precached.
      await cache.addAll(
        BUILD.files.map((file) =>
          file.startsWith('assets/') ? file : new Request(file, { cache: 'reload' }),
        ),
      );
      // No skipWaiting on purpose: a child may be mid-activity. The new worker
      // takes over when all tabs close — calm beats clever here.
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== PRECACHE && key !== FONTS) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

/** Google Fonts: the stylesheet and the font files it names, kept for offline. */
async function font(event) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  // waitUntil: the worker must stay alive until the copy is actually stored
  if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(font(event));
    return;
  }
  if (url.origin !== self.location.origin) return; // never touch anything else

  // SPA navigation: try the network (fresh content), fall back to the shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match('index.html', { cacheName: PRECACHE });
        return shell || Response.error();
      }),
    );
    return;
  }

  // Everything else: this build's precache, then the network. (A miss means a
  // newer build's page is asking — that build's own worker will precache it.)
  event.respondWith(
    caches.match(request, { cacheName: PRECACHE }).then((cached) => cached || fetch(request)),
  );
});
