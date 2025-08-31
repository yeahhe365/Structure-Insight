const CACHE_NAME = 'structure-insight-v2'; // Bump version to force update & clear old caches
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Note: Bundled JS/CSS are not listed here as their names are dynamic.
  // The fetch handler will cache them on the fly.
];

// Cache CDN resources
const cdnUrlsToCache = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
    'https://esm.sh/react@^19.1.0',
    'https://esm.sh/react-dom@^19.1.0/client',
    'https://esm.sh/framer-motion@^11.0.8',
    'https://esm.sh/jszip@3.10.1',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        const allUrlsToCache = [...urlsToCache, ...cdnUrlsToCache];
        return cache.addAll(allUrlsToCache).catch(err => {
            console.error('Failed to cache some resources during install:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignore non-GET requests and requests from browser extensions
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return from cache if found.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from the network.
        return fetch(request.clone()).then(
          networkResponse => {
            // A response was received from the network.
            
            // Do not cache non-ok responses or opaque responses from cross-origin requests
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response to cache it
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Put the response in the cache, handling potential errors
                cache.put(request, responseToCache).catch(err => {
                  console.warn(`SW: Failed to cache ${request.url}:`, err);
                });
              });

            return networkResponse;
          }
        ).catch(error => {
            // This will catch network errors (e.g., offline) and errors from fetch()
            // for unsupported schemes. This prevents the service worker from crashing.
            console.warn(`SW: Fetch failed for ${request.url}:`, error);
            throw error;
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
