// This is a static file, which is more stable than a dynamically generated one.
// It ensures the browser doesn't constantly think the file has changed,
// which was the cause of the repeated "site updated" notifications.
console.log('[SW] Static Push Service Worker v1 loaded.');

self.addEventListener('install', (event) => {
  console.log('[SW] Installed.');
  // This is a best practice. It ensures that any new version of the service worker
  // activates immediately, rather than waiting for all old tabs to be closed.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated.');
  // This allows an active service worker to take control of the page immediately,
  // which is useful for ensuring notifications work right away after an update.
  event.waitUntil(self.clients.claim());
});

// The 'push' event is the core of our notification logic.
// It's triggered when a push message is received from the FCM server.
self.addEventListener('push', (event) => {
  console.log('[SW] Push Received.');
  
  if (!event.data) {
    console.error('[SW] Push event but no data');
    return;
  }

  try {
    // The data sent from our server is a JSON string.
    const pushData = event.data.json();
    console.log('[SW] Push data parsed:', pushData);

    // Our custom data is nested in the 'data' property by the Firebase Admin SDK.
    const notificationData = pushData.data;

    if (!notificationData || !notificationData.notificationTitle || !notificationData.notificationBody) {
      console.error('[SW] Incomplete notification data in payload:', notificationData);
      // Even if data is incomplete, we should not show a generic notification.
      return;
    }

    const title = notificationData.notificationTitle;
    const options = {
      body: notificationData.notificationBody,
      // Using a generic icon is safer. You can update this to a real path.
      icon: '/favicon.ico', 
      // A tag ensures that subsequent notifications with the same tag replace old ones.
      tag: 'gym-agenda-notification' 
    };

    // This is the native browser command to show the notification.
    event.waitUntil(self.registration.showNotification(title, options));

  } catch (error) {
    console.error('[SW] Error processing push event', error);
  }
});
