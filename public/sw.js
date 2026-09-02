const CACHE_NAME = 'badminton-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch with network first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
