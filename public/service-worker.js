// install event handler
self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('static').then( cache => {
        return cache.addAll([
            '/index.html',
            '/icons/icon-192x192.png',
            '/icons/icon-512x512.png',
            '/index.js',
            '/styles.css',
            ]);
      })
    );
    console.log('Install');
    self.skipWaiting();
  });
  
  // retrieve assets from cache
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then( response => {
        return response || fetch(event.request);
      })
    );
  });

console.log("hello from service worker")
  
