/* Mia offline service worker (v2).
   Mia's AI runs on-device, but the library CODE (WebLLM, vits-web), its WASM,
   and the model/voice downloads all come from the network on demand. Without
   caching them, a reload while offline can't start the engine and Mia can't
   answer. This caches everything it sees so Mia works fully offline after one
   online run.

   Strategy:
   - Same-origin app shell  → network-first (use the local server when up),
                              fall back to cache when offline.
   - Everything else (CDN libraries, WASM, HuggingFace model shards, voices)
                            → cache-first (they're immutable), then network.
   Big model/voice files are cached here too, so offline never depends on any
   one library's own cache behaving. */
const CACHE = 'mia-offline-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // drop old versions
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

async function cachePut(req, res){
  try {
    if (res && (res.ok || res.type === 'opaque')){
      const cache = await caches.open(CACHE);
      await cache.put(req, res.clone());
    }
  } catch(e){ /* quota or opaque — ignore */ }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch(e){ return; }
  if (!/^https?:$/.test(url.protocol)) return;

  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin){
    // network-first: prefer the live app files, fall back to cache offline
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        event.waitUntil(cachePut(req, res.clone()));
        return res;
      } catch(e){
        const cached = await caches.match(req);
        if (cached) return cached;
        // last resort for navigations: serve the cached shell
        if (req.mode === 'navigate'){
          const shell = (await caches.match('index.html')) || (await caches.match('./')) || (await caches.match('/'));
          if (shell) return shell;
        }
        throw e;
      }
    })());
    return;
  }

  // cross-origin (CDN code, wasm, model shards, voices): cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached){
      event.waitUntil(fetch(req).then(r => cachePut(req, r)).catch(() => {}));
      return cached;
    }
    try {
      const res = await fetch(req);
      return await cachePut(req, res);
    } catch(e){
      const fallback = await caches.match(req);
      if (fallback) return fallback;
      throw e;
    }
  })());
});
