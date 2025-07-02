import { NextResponse } from 'next/server';

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const scriptContent = `
    self.importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
    self.importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    
    if (firebaseConfig && firebaseConfig.apiKey) {
      if (firebase.apps.length === 0) {
          firebase.initializeApp(firebaseConfig);
      }
      
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message: ', payload);

        if (!payload.data || !payload.data.notificationTitle) {
            console.log('[SW] This message did not have our expected custom data. Ignoring.');
            return;
        }

        const notificationTitle = payload.data.notificationTitle;
        const notificationOptions = {
          body: payload.data.notificationBody,
          tag: 'gym-agenda-notification'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      console.error("[SW] Firebase configuration is missing or incomplete. This is a build-time issue.");
    }
  `;
  
  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}
