/**
 * Structure Insight Web - Service Worker
 * 用于离线缓存和PWA功能
 */

const CACHE_NAME = 'structure-insight-web-v1';

// 需要预缓存的资源列表
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/base.css',
  '/css/components.css',
  '/css/dialogs.css',
  '/css/editor.css',
  '/css/file-tree.css',
  '/css/layout.css',
  '/css/responsive.css',
  '/css/variables.css',
  '/js/utils.js',
  '/js/hooks/settingsHooks.js',
  '/js/hooks/fileHooks.js',
  '/js/hooks/uiHooks.js',
  '/js/components/editorComponents.js',
  '/js/components/fileComponents.js',
  '/js/components/uiComponents.js',
  '/js/app/appHelpers.js',
  '/js/app/app.js',
  '/favicon_io/android-chrome-192x192.png',
  '/favicon_io/android-chrome-512x512.png',
  '/favicon_io/apple-touch-icon.png',
  '/favicon_io/favicon-16x16.png',
  '/favicon_io/favicon-32x32.png',
  '/favicon_io/favicon.ico',
  '/manifest.json'
];

// 不使用网络回退的API（保持离线状态下的功能）
const OFFLINE_ONLY_API = [
  '/api/offline'
];

// CDN 资源列表
const CDN_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/xml.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/css.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/markdown.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// 安装事件 - 预缓存所有静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => {
        // 预缓存 CDN 资源，但不阻止 SW 安装完成
        // 修复: 明确返回 Promise.resolve()
        caches.open(CACHE_NAME + '-cdn')
          .then(cache => {
            return cache.addAll(CDN_RESOURCES);
          })
          .catch(error => {
            console.error('预缓存 CDN 资源失败:', error);
          });
        return Promise.resolve(); // 明确返回一个已解析的promise，确保链式调用正确
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, CACHE_NAME + '-cdn'];

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  // 忽略不是 GET 请求的内容
  if (event.request.method !== 'GET') return;

  // 提取 URL 字符串
  const url = event.request.url;

  // 检查是否是 CDN 资源
  const isCdnResource = CDN_RESOURCES.some(resource => url.includes(resource));

  // 为 CDN 资源使用特定的缓存策略
  if (isCdnResource) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 返回缓存的响应，同时在后台更新缓存
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                // 检查响应是否有效
                if (networkResponse && networkResponse.status === 200) {
                  const responseToCache = networkResponse.clone();
                  caches.open(CACHE_NAME + '-cdn')
                    .then(cache => {
                      cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
              })
              .catch(() => cachedResponse);
            
            return cachedResponse;
          }

          // 如果没有缓存，尝试从网络获取
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }

              // 缓存响应的克隆
              const responseToCache = response.clone();
              caches.open(CACHE_NAME + '-cdn')
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
    return;
  }

  // 对于离线 API，直接使用缓存，不尝试网络
  if (OFFLINE_ONLY_API.some(api => url.includes(api))) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || new Response(JSON.stringify({
            offline: true,
            message: '当前处于离线状态'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 对于所有其他请求使用网络优先策略
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 检查响应是否有效
        if (!response || response.status !== 200) {
          return response;
        }

        // 缓存响应的克隆
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            // 只缓存应用内部请求
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, responseToCache);
            }
          });

        return response;
      })
      .catch(() => {
        // 网络请求失败时，尝试从缓存获取
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // 如果是 HTML 请求，返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }

            // 如果没有离线页面缓存，返回简单的离线响应
            return new Response('您当前处于离线状态', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// 推送通知支持
self.addEventListener('push', event => {
  const title = 'Structure Insight Web';
  const options = {
    body: event.data.text(),
    icon: '/favicon_io/android-chrome-192x192.png',
    badge: '/favicon_io/favicon-32x32.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知点击事件处理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // 如果已经有打开的窗口，则聚焦到那个窗口
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // 如果没有，则打开一个新窗口
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});