import { NextResponse } from 'next/server';

export async function GET() {
  // This route generates the service worker file dynamically.
  // We are NOT using the Firebase client library inside the service worker anymore.
  // Instead, we are using the native Push API, which is more robust.

  const scriptContent = `
    // This console.log helps us confirm that the browser is loading the new version of the SW.
    console.log('[SW] Service Worker script v2 loaded.');

    // The 'install' event is fired when the service worker is first installed.
    self.addEventListener('install', (event) => {
      console.log('[SW] Installed.');
      // This forces the waiting service worker to become the active service worker.
      event.waitUntil(self.skipWaiting());
    });
    
    // The 'activate' event is fired when the service worker becomes active.
    self.addEventListener('activate', (event) => {
      console.log('[SW] Activated.');
      // This allows an active service worker to take control of the page immediately.
      event.waitUntil(self.clients.claim());
    });

    // The 'push' event is the core of our notification logic.
    // It's triggered when a push message is received from the server.
    self.addEventListener('push', (event) => {
      console.log('[SW] Push Received.');
      
      if (!event.data) {
        console.error('[SW] Push event but no data');
        return;
      }

      try {
        // The data sent from the Firebase Admin SDK is a JSON string.
        const pushData = event.data.json();
        console.log('[SW] Push data parsed:', pushData);

        // Our custom data is nested in the 'data' property.
        const notificationData = pushData.data;

        if (!notificationData || !notificationData.notificationTitle || !notificationData.notificationBody) {
          console.error('[SW] Incomplete notification data in payload:', notificationData);
          return;
        }

        const title = notificationData.notificationTitle;
        const options = {
          body: notificationData.notificationBody,
          icon: '/favicon.ico', // You can replace this with a real icon path
          tag: 'gym-agenda-notification' // A tag ensures that subsequent notifications replace old ones.
        };

        // This is the command that actually shows the notification to the user.
        event.waitUntil(self.registration.showNotification(title, options));

      } catch (error) {
        console.error('[SW] Error processing push event', error);
      }
    });
  `;
  
  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}
