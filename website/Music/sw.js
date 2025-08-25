const CACHE_NAME = 'music-platform-v1';
const urlsToCache = [
  '/music/',
  '/music/browse',
  '/music/upload',
  '/music/dashboard',
  '/music/static/css/main.css',
  '/music/static/js/main.js',
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
        return response || fetch(event.request);
      })
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
    body: event.data ? event.data.text() : 'New music available!',
    icon: '/music/icon-192x192.png',
    badge: '/music/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Browse Music',
        icon: '/music/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/music/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Music Platform', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/music/browse')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync any pending uploads or actions
    console.log('Performing background sync...');
    
    // Example: Sync offline uploads
    const pendingUploads = await getPendingUploads();
    for (const upload of pendingUploads) {
      await syncUpload(upload);
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions (implement based on your app's needs)
async function getPendingUploads() {
  // Get pending uploads from IndexedDB or localStorage
  return [];
}

async function syncUpload(upload) {
  // Sync upload to server
  console.log('Syncing upload:', upload);
}
