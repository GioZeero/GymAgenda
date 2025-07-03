// This file must be in the /public folder

self.addEventListener('install', (event) => {
  // Activate the new service worker as soon as it's installed.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all pages under this service worker's scope immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // Ensure there's data in the push event.
  if (!event.data) {
    console.error('Push event received with no data.');
    return;
  }

  // Parse the data from the push event.
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // If parsing fails, create a default payload to show something.
    console.error('Error parsing push data JSON', e);
    payload = { data: { notificationTitle: 'New Message', notificationBody: event.data.text() } };
  }

  const title = payload.data?.notificationTitle || 'GymAgenda';
  const options = {
    body: payload.data?.notificationBody || 'You have a new notification.',
    // You can add more options here like an icon, badge, etc.
    // icon: '/icon-192x192.png',
  };

  // Show the notification.
  event.waitUntil(self.registration.showNotification(title, options));
});
