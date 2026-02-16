
const CACHE_NAME = 'sportsnote-v1';
const STATIC_ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Contrail+One&family=Roboto:wght@300;400;500;700&display=swap'
];

// Instalación y cacheo de recursos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpieza de versiones antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estrategia Cache-First con actualización dinámica (Network Fallback)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cachear dinámicamente recursos de esm.sh y otros CDNs
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (event.request.url.includes('esm.sh') || event.request.url.includes('dicebear') || event.request.url.includes('fonts.'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay red ni caché, y es una navegación, devolver el index.html
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});