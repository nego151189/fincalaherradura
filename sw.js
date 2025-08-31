// sw.js - Versión mejorada
const CACHE = "finca-herradura-v25";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.json",
  "./js/firebase-config.js",
  "./js/auth.js", 
  "./js/offline.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      console.log('Service Worker instalado');
      return Promise.resolve(); // No forzar cacheo inicial
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Intentar network primero, fallar a cache
      return fetch(event.request)
        .then((response) => {
          // Cachear respuesta exitosa
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si está disponible
          return cached || new Response('Offline', { 
            status: 503, 
            statusText: 'Offline',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
