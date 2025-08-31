// sw.js — Versión corregida
const CACHE = "finca-herradura-v24";
const APP_SHELL = [
  "/",
  "index.html",
  "css/style.css",
  "manifest.json",
  "js/firebase-config.js",
  "js/auth.js",
  "js/offline.js",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      // Cachear solo los archivos esenciales que existen
      return Promise.all(
        APP_SHELL.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.log('No se pudo cachear:', url);
              return Promise.resolve();
            })
            .catch(error => {
              console.log('Error cacheando:', url, error);
              return Promise.resolve();
            });
        })
      );
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
  const req = event.request;
  if (req.method !== "GET") return;
  
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached || new Response('Offline', { status: 503, statusText: 'Offline' }));
      return cached || fetchPromise;
    })
  );
});
