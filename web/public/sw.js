const CACHE_NAME = 'concept-pwa-v5';

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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
    (async () => {
      // Enable Navigation Preload if supported
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation Preload enabled.');
        } catch (err) {
          console.warn('[SW] Navigation Preload notice:', err);
        }
      }

      // Purge outdated caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Helper for timeout race
function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Only handle GET requests for http/https
  if (req.method !== 'GET' || !url.startsWith('http')) {
    return;
  }

  // Never cache app-version.json (always direct network for instant update detection)
  if (url.includes('app-version.json')) {
    event.respondWith(
      fetch(req).catch(() => new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Navigation requests: Navigation Preload with 400ms timeout race & 0ms instant cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Fast network attempt (via navigationPreload or fast fetch, timeout at 400ms)
        try {
          const networkPromise = (async () => {
            const preload = await event.preloadResponse;
            if (preload && preload.status === 200) {
              cache.put('./index.html', preload.clone());
              return preload;
            }
            const res = await fetch(req);
            if (res && res.status === 200) {
              cache.put('./index.html', res.clone());
            }
            return res;
          })();

          // Race network against 400ms timeout
          return await Promise.race([networkPromise, timeout(400)]);
        } catch {
          // Timeout reached or Offline: serve instantly from cache (0 ms)
          const cached = (await cache.match('./index.html')) || 
                         (await cache.match('index.html')) || 
                         (await cache.match('./')) || 
                         (await cache.match(req));
          if (cached) {
            return cached;
          }
          // Fallback if not cached yet
          return (await fetch(req)).catch(() => Response.error());
        }
      })()
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
