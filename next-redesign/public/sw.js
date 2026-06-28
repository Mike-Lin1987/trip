const CACHE_VERSION = "2026-06-25-v2";
const CACHE_NAME = `hokuriku-itinerary-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
];

const STATIC_CACHE_PATHS = new Set([
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
]);

const EXCLUDED_PATH_PREFIXES = [
  "/trip/hokuriku-2026/expenses",
  "/trip/hokuriku-2026/settlement",
];

const EXCLUDED_URL_PATTERNS = [
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("hokuriku-itinerary-"))
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (shouldSkipRequest(request)) {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith("/_next/static") || STATIC_CACHE_PATHS.has(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function shouldSkipRequest(request) {
  if (request.method !== "GET") {
    return true;
  }

  const url = new URL(request.url);

  if (EXCLUDED_URL_PATTERNS.some((pattern) => request.url.includes(pattern))) {
    return true;
  }

  if (url.origin !== self.location.origin) {
    return true;
  }

  return EXCLUDED_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}
