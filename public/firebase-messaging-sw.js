// This file MUST be in the /public folder

// Using compat libraries as recommended by Firebase for service workers in many setups.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// This part is crucial: we retrieve the configuration that was passed as a query parameter
// when the service worker was registered.
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));

    // Initialize the Firebase app in the service worker with the retrieved config.
    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    // This listener handles messages received when the app is in the background or closed.
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        // Customize the notification that will be shown to the user.
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            // Optional: You can add an icon here. It must be in the /public folder.
            // icon: '/icon.png'
        };

        // The 'showNotification' method is what actually displays the notification on the user's device.
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error('Firebase config not found in service worker. Notifications will not work.');
}
