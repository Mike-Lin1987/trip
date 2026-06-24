const CACHE_VERSION = "2026-06-25-v1";
const CACHE_NAME = `hokuriku-itinerary-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/itinerary",
  "/itinerary/day-1",
  "/itinerary/day-2",
  "/itinerary/day-3",
  "/itinerary/day-4",
  "/itinerary/day-5",
  "/itinerary/day-6",
  "/itinerary/day-7",
  "/itinerary/day-8",
  "/hotels",
  "/transport",
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
];

const HTML_CACHE_PATHS = new Set([
  "/",
  "/itinerary",
  "/itinerary/day-1",
  "/itinerary/day-2",
  "/itinerary/day-3",
  "/itinerary/day-4",
  "/itinerary/day-5",
  "/itinerary/day-6",
  "/itinerary/day-7",
  "/itinerary/day-8",
  "/hotels",
  "/transport",
]);

const STATIC_CACHE_PATHS = new Set([
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
]);

const EXCLUDED_PATH_PREFIXES = [
  "/photos",
  "/trip/hokuriku-2026/expenses",
  "/trip/hokuriku-2026/settlement",
];

const EXCLUDED_URL_PATTERNS = [
  "accounts.google.com",
  "oauth2.googleapis.com",
  "www.googleapis.com/drive",
  "upload",
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
    return;
  }

  if (HTML_CACHE_PATHS.has(normalizePathname(url.pathname))) {
    event.respondWith(networkFirst(request));
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

function normalizePathname(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    return cache.match("/");
  }
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
