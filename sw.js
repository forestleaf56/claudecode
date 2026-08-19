/* Mia offline cache (clean, minimal — no reloads, no page interference).

   Mia's AI runs on-device, but the LIBRARY code (WebLLM, transformers.js,
   vits-web) and their WASM come from CDNs, and the model weights from
   HuggingFace. The browser's normal HTTP cache evicts those under storage
   pressure (you now have an LLM + a voice + a 150 MB recognizer), which is why
   things stopped loading offline. This caches every cross-origin GET in the
   Cache API (which navigator.storage.persist() then protects from eviction),
   so everything loads offline after one online run.

   Same-origin requests (your local server / the HTML itself) are left alone —
   the local server is always reachable, even in airplane mode. */
const CACHE = 'mia-cache-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE && /^mia-/.test(k)).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.origin === self.location.origin) return;   // leave the app / local server alone

  // cache-first for all cross-origin resources (CDN code, WASM, model weights)
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (e) {
      const fallback = await cache.match(req);
      if (fallback) return fallback;
      throw e;
    }
  })());
});
