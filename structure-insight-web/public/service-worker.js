const CACHE_NAME = 'structure-insight-v3'; // Bump version for a clean update
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
        // Use individual cache.add calls to prevent one failure from stopping the whole cache process
        const promises = allUrlsToCache.map(url => cache.add(url).catch(err => {
            console.warn(`SW: Failed to cache ${url} during install:`, err);
        }));
        return Promise.all(promises);
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

  // Only handle http/https GET requests. Let browser handle the rest.
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get the response from the cache.
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. If not in cache, fetch from the network.
      try {
        const networkResponse = await fetch(request);
        
        // 3. Cache the valid network response.
        // Use .ok to check for status in the range 200-299.
        if (networkResponse && networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          // Use event.waitUntil to avoid blocking the response to the page.
          event.waitUntil(cache.put(request, responseToCache));
        }
        
        return networkResponse;
      } catch (error) {
        // This will catch network errors (e.g., offline) and
        // TypeError for unsupported schemes that might slip through the initial guard.
        console.warn(`SW: Fetching ${request.url} failed:`, error);
        // Re-throw the error to propagate the failure, 
        // which will result in a standard browser network error page.
        throw error;
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});