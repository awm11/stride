// Offline support for Stride.
// The page is fetched fresh when online (so updates arrive) and served from cache when offline.
// Bump APP_CACHE on every release.
const APP_CACHE = 'stride-app-v1';
const FONT_CACHE = 'stride-fonts-v1';
const LIB_CACHE = 'stride-libs-v1';
const TILE_CACHE = 'stride-tiles-v1';
const TILE_LIMIT = 600;
const KEEP = [APP_CACHE, FONT_CACHE, LIB_CACHE, TILE_CACHE];
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

let tilePuts = 0;
async function trimTiles(){
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - TILE_LIMIT; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cached copy first, refreshed in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const hit = await cache.match(req);
      const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
  // Sign-in library and map library: versioned files that never change, kept for offline starts.
  if ((url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) ||
      (url.hostname === 'unpkg.com' && url.pathname.startsWith('/leaflet@'))) {
    event.respondWith(caches.open(LIB_CACHE).then(async cache => {
      const hit = await cache.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res;
    }));
    return;
  }
  // Map tiles: keep the ones you've looked at (up to a limit) so maps still show without a signal.
  if (url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('.tile.opentopomap.org')) {
    event.respondWith(caches.open(TILE_CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.type === 'cors') {
        cache.put(req, res.clone());
        if (++tilePuts % 50 === 0) trimTiles();
      }
      return res;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // The page itself: network first, cache when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(APP_CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Icons and manifest: cache first.
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
