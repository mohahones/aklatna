self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch (err) {
      // network failed — try cache
      const cached = await caches.match(event.request);
      if (cached) return cached;
      // if it's a navigation request, try to serve the app shell (index.html)
      if (event.request.mode === 'navigate') {
        const indexCached = await caches.match('/index.html') || await caches.match('index.html');
        if (indexCached) return indexCached;
      }
      // fallback: return a minimal offline Response
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
