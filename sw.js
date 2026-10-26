// Offline copy of UV Studio+. Online, files always come from the network (and refresh the
// copy); the copy is used only when the network fails. One copy per file, latest version only.
// Same-origin GETs only: the firmware and app catalogs and URL imports stay online-only.
// The Pages workflow fills FILES (every site file but the 10 MB factory set, which is cached
// once used) and BUILD (the commit), so each deploy installs a fresh copy and drops the old one.
// /uvstudio/ and /uvstudio/test/ keep separate copies.
const FILES = [];
const BUILD = '';
const PREFIX = `uvstudio-plus ${self.registration.scope} `;
const CACHE = PREFIX + BUILD;
// A network that is connected but has no internet (dead hotspot, one bar) can stall each request
// for ~20 s before failing, so the copy is used after this long. Raise it if slow but working
// networks keep getting the copy.
const TIMEOUT_MS = 3000;
const key = url => url.split(/[?#]/)[0];   // ?v= cache keys don't make extra copies

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' })))));
});

self.addEventListener('activate', event => event.waitUntil(caches.keys()
  .then(names => Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name))))
  .then(() => self.clients.claim())));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const network = fetch(request);
    // Registered before the race below, so the copy is cloned before the page reads the body.
    // A reply that comes after the timeout still refreshes the copy.
    event.waitUntil(network.then(response => response.ok && cache.put(key(request.url), response.clone())).catch(() => {}));
    try {
      return await Promise.race([network, new Promise((_, reject) => setTimeout(reject, TIMEOUT_MS))]);
    } catch {
      return (await cache.match(key(request.url)))
        || (request.mode === 'navigate' && await cache.match(new URL('index.html', self.registration.scope).href))
        || network.catch(() => Response.error());   // no copy: keep waiting for the network
    }
  })());
});
