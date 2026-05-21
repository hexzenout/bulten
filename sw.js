const CACHE_NAME = "v46a2-force-remove-rolling-cache-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/js/app-fixes.js",
  "./assets/js/firebase.js",
  "./assets/js/finance.js",
  "./assets/js/crypto.js",
  "./assets/js/alarm-audio.js",
  "./assets/js/alarm-center.js",
  "./assets/js/v28-crypto-panel.js",
  "./assets/js/pwa.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => null);
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
