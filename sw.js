const CACHE_NAME = 'app-distribuidora-v44';
const APP_SHELL = ['./', './index.html', './manifest.json', './sw.js', './excel-export.js', './auth.js', './data.js?v=3', './chart.js?v=3', './ui.js?v=3', './app.js?v=3', './reports.js?v=3', './views/home.html', './views/sd.html', './views/mm.html', './views/fi.html', './views/pp.html', './views/settings.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return networkResponse;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
