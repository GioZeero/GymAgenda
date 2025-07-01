// This file MUST be in the public folder

// Using the Firebase SDK a little over v9. It is compatible with the v11 client SDK.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('Service Worker v5 (custom) is loading...');

const urlParams = new URLSearchParams(self.location.search);
const firebaseConfigStr = urlParams.get('firebaseConfig');

if (firebaseConfigStr) {
    // URLSearchParams automatically decodes the value, so we can parse it directly.
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    
    // Initialize Firebase
    try {
        console.log('[SW] Initializing Firebase...');
        const app = firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging(app);

        messaging.onBackgroundMessage((payload) => {
            console.log('[SW] Received background message: ', payload);

            // A 'data-only' message is expected from the server.
            // Check if the payload has the data we need.
            if (!payload.data || !payload.data.title) {
                console.error('[SW] The message payload did not contain `data` or `data.title`.');
                return;
            }
            
            const notificationTitle = payload.data.title;
            const notificationOptions = {
                body: payload.data.body || '', // Ensure body exists, even if empty.
                // Note: Icons can improve user experience but require the icon files to exist in /public.
                // icon: '/icon-192x192.png',
            };
            
            console.log('[SW] Showing custom notification:', notificationTitle, notificationOptions);
            
            // Use waitUntil to ensure the browser doesn't terminate the service
            // worker before our notification has been displayed.
            self.registration.showNotification(notificationTitle, notificationOptions);
        });

        console.log('[SW] Background message handler has been set successfully.');

    } catch (error) {
        console.error('[SW] Error during Firebase initialization or handler setup:', error);
    }
} else {
    console.error('[SW] Firebase config not found in the query string. This is required.');
}
