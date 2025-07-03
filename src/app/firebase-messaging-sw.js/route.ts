'use server';

import {NextResponse} from 'next/server';

// This route generates the service worker file dynamically with the correct Firebase config.
export async function GET() {
  const firebaseVersion = '10.12.3';

  const scriptContent = `
    importScripts("https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging-compat.js");

    const firebaseConfig = {
      apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
      authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
      projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
      storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
      messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
      appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
      );
      
      const notificationTitle = payload.data.notificationTitle;
      const notificationOptions = {
        body: payload.data.notificationBody,
        icon: '/favicon.ico'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('install', (event) => {
        console.log('Service Worker: Installing...');
        self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
        console.log('Service Worker: Activating...');
        event.waitUntil(self.clients.claim());
    });
  `;

  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}
