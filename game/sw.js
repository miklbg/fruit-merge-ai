// Service Worker for Fruit Merge Game
const CACHE_NAME = 'fruit-merge-v1';
const urlsToCache = [
  './index.html',
  './css/tailwind.min.css',
  './matter.min.js',
  './audio/web-audio-bgm.js',
  './assets/icon.png',
  './assets/world.png',
  './assets/1-blueberry.png',
  './assets/2-strawberry.png',
  './assets/3-lemon.png',
  './assets/4-apple.png',
  './assets/5-orange.png',
  './assets/6-grapes.png',
  './assets/7-cantaloupe.png',
  './assets/8-coconut.png',
  './assets/9-pineapple.png',
  './assets/10-watermelon.png',
  './assets/weave_background.png',
  './assets/weave_bottom.png',
  './assets/weave_ends.png',
  './assets/weave_sides.png',
  './assets/children-music-loop-creative-fun-262427.mp3',
  './manifest.json'
];

// Helper function to check if response is valid for caching
function isValidResponse(response) {
  return response && 
         response.status >= 200 && 
         response.status < 300 && 
         (response.type === 'basic' || response.type === 'cors');
}

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response for caching
          if (!isValidResponse(response)) {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response asynchronously
          caches.open(CACHE_NAME)
            .then(cache => {
              return cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.error('Failed to cache response:', err);
            });
          
          return response;
        }).catch(err => {
          console.error('Fetch failed:', err);
          // Network request failed - the resource is not cached
          throw err;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
