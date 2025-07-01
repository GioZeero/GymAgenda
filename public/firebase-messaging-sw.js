// This file MUST be in the /public folder

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// A bit of a hack to get the config from the URL query parameters
// This is necessary because service workers can't access environment variables
const urlParams = new URLSearchParams(location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        onBackgroundMessage(messaging, (payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);

            // We must receive a `data` payload to customize the notification
            if (payload.data) {
                const notificationTitle = payload.data.title;
                const notificationOptions = {
                    body: payload.data.body,
                    // You can add an icon here, e.g., icon: '/icon-192x192.png'
                };

                self.registration.showNotification(notificationTitle, notificationOptions);
            } else {
                console.log('[firebase-messaging-sw.js] Received push without data payload.');
            }
        });
    } catch(e) {
        console.error('[firebase-messaging-sw.js] Error initializing Firebase', e);
    }
} else {
    console.error('[firebase-messaging-sw.js] Firebase config not found in query params.');
}
