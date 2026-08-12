const CACHE_NAME = 'getusranked-v1';

// Static assets to precache immediately on SW install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.svg',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// Install Event: Precache static core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old cache stores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('getusranked-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Strategy:
// 1. Static Assets (fonts, images, js, css, astro assets): Cache First, fallback to Network
// 2. Navigation / HTML requests: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin extension/API calls if needed
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle Static Asset Caching (Cache First)
  const isStaticAsset =
    url.pathname.startsWith('/_astro/') ||
    /\.(png|jpe?g|svg|webp|avif|ico|woff2?|ttf|eot|css|js)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Handle HTML navigation routes (Stale-While-Revalidate)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, fallback to cached offline page if available
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
