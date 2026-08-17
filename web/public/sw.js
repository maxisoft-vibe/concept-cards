const CACHE_NAME = 'concept-pwa-v4';

// Essential assets to cache on install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './apple-touch-icon.png',
  './data/words.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Core precache notice:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests for http/https
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // Navigation requests (HTML page): INSTANT OFFLINE-FIRST (0 ms startup)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = (await cache.match('./index.html')) || 
                       (await cache.match('index.html')) || 
                       (await cache.match('./')) || 
                       (await cache.match(req));

        if (cached) {
          // If online in the background, fetch fresh copy without blocking the page
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put('./index.html', networkResponse.clone());
            }
          }).catch(() => {
            // Offline: silently ignore background update error
          });
          return cached;
        }

        // First install / not in cache yet: fetch from network
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put('./index.html', networkResponse.clone());
          }
          return networkResponse;
        }).catch(async () => {
          return (await cache.match('./index.html')) || (await cache.match('index.html')) || Response.error();
        });
      })
    );
    return;
  }

  // All other assets (JS, CSS, JSON, Images, Fonts): Cache-first with network fallback & cache populate
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network and store in cache
      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkResponse;
      }).catch(async (err) => {
        // Fallback for offline if not already matched
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(req, { ignoreSearch: true });
        if (match) return match;
        throw err;
      });
    })
  );
});
