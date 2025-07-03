/**
 * This service worker handles incoming push notifications.
 * It's intentionally kept simple and static to ensure stability and
 * prevent the browser from generating "site updated" notifications.
 */

// When a push notification is received
self.addEventListener('push', function (event) {
  // Default data if the push message is empty
  let notificationData = {
    title: 'Nuova notifica',
    body: 'Hai un nuovo messaggio.',
    icon: '/icon-192.png' // A default icon
  };

  // Try to parse the data from the push event
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.notificationTitle,
        body: payload.notificationBody,
        icon: '/icon-192.png' // You can customize this
      };
    } catch (e) {
      console.error('Push event data parsing error:', e);
    }
  }

  const title = notificationData.title;
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
  };

  // Show the notification
  event.waitUntil(self.registration.showNotification(title, options));
});

// When the service worker is installed
self.addEventListener('install', (event) => {
  // This forces the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

// When the service worker is activated
self.addEventListener('activate', (event) => {
  // This allows an active service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});
