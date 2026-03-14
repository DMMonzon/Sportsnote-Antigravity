const CACHE_NAME = 'sportsnote-v4'; // Nueva versión para forzar limpieza profunda
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx', // Aseguramos el script principal
  '/assets/logo-sportsnote-v2.png',
  '/assets/logoLargoSN.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Contrail+One&family=Roboto:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Si está en caché (como el HTML), lo entregamos rápido
      if (cachedResponse) return cachedResponse;

      // 2. Si no está (como las librerías de esm.sh), lo buscamos en red y LO GUARDAMOS
      return fetch(event.request).then((response) => {
        // Solo guardamos si la respuesta es válida
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // 3. Si todo falla (offline) y es navegación, entregamos el index.html
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});