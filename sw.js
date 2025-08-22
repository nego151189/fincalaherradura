// sw.js — bump para MAGA
const CACHE = "finca-herradura-v23"; // 🔧 bump
const APP_SHELL = [
  "/",
  "index.html",
  "arboles.html",
  "produccion.html",
  "riegos.html",
  "precios.html",
  "tratamientos.html",
  "ventas.html",
  "gastos.html",
  "recordatorios.html",
  "clima.html",
  "login.html",
  "css/main.css",
  "manifest.json",
  "js/firebase-config.js",
  "js/auth.js",
  "js/offline.js",
  "js/nav.js",
  "js/index.js",
  "js/arboles.js",
  "js/produccion.js",
  "js/riegos.js",
  "js/precios.js",
  "js/tratamientos.js",
  "js/ventas.js",
  "js/gastos.js",
  "js/recordatorios.js",
  "js/clima.js",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
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
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

