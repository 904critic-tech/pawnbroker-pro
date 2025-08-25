const CACHE_NAME = 'pawnbroker-pro-v1.0.0';
const urlsToCache = [
  '/pawnbroker-pro/',
  '/pawnbroker-pro/index.html',
  '/pawnbroker-pro/manifest.json',
  '/styles.css',
  '/download.html',
  '/pawnbroker-privacy.html',
  '/pawnbroker-terms.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/pawnbroker-pro/icons/icon-192x192.png',
    badge: '/pawnbroker-pro/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/pawnbroker-pro/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pawnbroker-pro/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PawnBroker Pro', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/pawnbroker-pro/')
    );
  }
});

// Background sync function
function doBackgroundSync() {
  // Handle offline data sync when connection is restored
  console.log('Background sync triggered');
  return Promise.resolve();
}
