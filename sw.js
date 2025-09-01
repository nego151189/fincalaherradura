// sw.js - Versión mejorada y corregida
const CACHE = "finca-herradura-v27"; // Incrementa la versión
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.json",
  "./js/firebase-config.js",
  "./js/auth.js", 
  "./js/offline.js"
];

// Función para validar si una URL es cacheable
function isValidCacheRequest(request) {
  const url = new URL(request.url);
  // Solo cachear HTTP/HTTPS y mismo origen
  return (url.protocol === 'http:' || url.protocol === 'https:') && 
         !url.href.includes('chrome-extension://') &&
         !url.href.includes('extension://') &&
         !url.href.includes('moz-extension://');
}

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
  // Solo manejar solicitudes GET válidas para cacheo
  if (event.request.method !== 'GET') {
    return;
  }

  // Validar URL antes de procesar
  if (!isValidCacheRequest(event.request)) {
    // Para URLs no válidas, solo hacer fetch normal sin cacheo
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Intentar network primero, fallar a cache
      return fetch(event.request)
        .then((response) => {
          // Cachear respuesta exitosa solo si es válida
          if (response.ok && isValidCacheRequest(event.request)) {
            const responseClone = response.clone();
            caches.open(CACHE).then((cache) => {
              // Usar try-catch para manejar errores de cacheo
              try {
                cache.put(event.request, responseClone);
              } catch (error) {
                console.warn('No se pudo cachear:', event.request.url, error);
              }
            }).catch((error) => {
              console.warn('Error abriendo cache:', error);
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
