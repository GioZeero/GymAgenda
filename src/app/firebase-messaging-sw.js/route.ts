import { NextResponse } from 'next/server';

export async function GET() {
  const scriptContent = `
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('push', (event) => {
      if (!event.data) {
        return;
      }

      let payload;
      try {
        payload = event.data.json();
      } catch (e) {
        payload = { data: { notificationTitle: 'New Message', notificationBody: event.data.text() } };
      }

      const title = payload.data?.notificationTitle || 'GymAgenda';
      const options = {
        body: payload.data?.notificationBody || 'You have a new notification.',
      };

      event.waitUntil(self.registration.showNotification(title, options));
    });
  `;

  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}
