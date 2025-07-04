// A completely vanilla service worker for handling push notifications.

// This event is fired when the service worker is installed.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // Forces the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

// This event is fired when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Ensures that the service worker takes control of the page immediately.
  event.waitUntil(self.clients.claim());
});

// This is the main event for handling push notifications.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  let data;
  try {
    // The push data is expected to be a JSON string.
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Push event contains non-JSON data.', e);
    return;
  }

  console.log('[Service Worker] Push data: ', data);

  // The 'data' object from FCM is nested within another 'data' object.
  const payload = data.data || {};
  
  const title = payload.notificationTitle || 'Nuova Notifica';
  const options = {
    body: payload.notificationBody || 'Hai ricevuto un nuovo messaggio.',
    // Utilizza una combinazione di titolo e corpo come tag per identificare univocamente la notifica
    // Questo aiuta a prevenire la visualizzazione di notifiche duplicate se il payload non fornisce un ID univoco.
    tag: `${title}-${payload.notificationBody}`,
    // Impedisce la visualizzazione di più notifiche con lo stesso tag contemporaneamente.
    // Le nuove notifiche sostituiranno quelle vecchie con lo stesso tag.
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// This event is fired when a user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  // This opens the app's URL and focuses an existing window if available.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        // If a window is already open, focus it.
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
