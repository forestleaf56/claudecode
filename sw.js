/* Mia offline service worker.
   The AI runs on-device, but the LIBRARY code (WebLLM, vits-web) and its WASM
   are imported from CDNs at runtime — so without this, a page reload while
   offline can't start the engine and Mia can't answer. This caches that code
   (cache-first) so Mia works fully offline after one online run.

   It deliberately does NOT cache the big model-weight downloads: WebLLM caches
   those itself (Cache API) and vits-web caches its voices in OPFS, so caching
   them here again would just double the storage. */
const CACHE = 'mia-offline-v1';

// Hosts that serve library / wasm code we want available offline.
const CODE_HOSTS = [
  'esm.run',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',   // onnxruntime-web wasm used by the realistic voice
  'esm.sh',
  'unpkg.com',
  'cdn.skypack.dev'
];

function shouldCache(url){
  try {
    const u = new URL(url);
    if (u.origin === self.location.origin) return true;      // the app itself
    return CODE_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch(e){ return false; }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!shouldCache(req.url)) return;   // let WebLLM / vits handle their own big files

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached){
      // stale-while-revalidate: serve cache now, refresh in the background if online
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && (fresh.ok || fresh.type === 'opaque')) await cache.put(req, fresh.clone());
        } catch(e){ /* offline — keep the cached copy */ }
      })());
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch(e){
      const fallback = await cache.match(req);
      if (fallback) return fallback;
      throw e;
    }
  })());
});
