// This is the default file Firebase looks for.
// By using this file, we let Firebase handle the registration automatically.
// This avoids conflicts and race conditions from manual registration.

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing.');
  // Ensure the new service worker activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating.');
  // Take control of all pages under its scope immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push Received.');

  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }
  
  try {
    // The payload from FCM is a string, which needs to be parsed as JSON
    const payload = event.data.json(); 
    console.log('[SW] Push payload: ', payload);

    // Extract the actual data we sent from our server
    const notificationData = payload.data;
    const title = notificationData.notificationTitle || 'Notifica da GymAgenda';
    const options = {
      body: notificationData.notificationBody || 'Controlla l\'app per le novità.',
      // You can add an icon here if you have one in the /public folder
      // icon: '/icon-192x192.png', 
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[SW] Error parsing push data or showing notification', e);
    // Fallback notification if parsing fails
    event.waitUntil(self.registration.showNotification('Notifica da GymAgenda', {
        body: 'Qualcosa è cambiato. Controlla l\'app.'
    }));
  }
});
