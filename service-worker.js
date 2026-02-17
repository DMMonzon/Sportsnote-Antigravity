const CACHE_NAME = 'sportsnote-v2'; // Cambiamos el nombre para forzar la actualización
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación: Cachear solo lo mínimo indispensable
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activación: Limpiar cachés antiguas
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

// --- ESTRATEGIA: Cache-First, Network Fallback (Dinámica) ---
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Si está en caché, devolverlo inmediatamente
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Si no está en caché, ir a la red
      return fetch(event.request).then((networkResponse) => {
        // Cachear dinámicamente CUALQUIER GET request exitoso
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 3. Fallback: Si no hay red y no está en caché, devolver index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});