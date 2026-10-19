// Service worker minimal (PWA, §10) : les pages déjà visitées restent consultables hors ligne.
// Stratégie « réseau d'abord » pour la navigation, « cache d'abord » pour les ressources statiques.
const CACHE = "marka-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy));
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cachePut(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(svg|png|woff2?)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cachePut(request, response))));
  }
});
