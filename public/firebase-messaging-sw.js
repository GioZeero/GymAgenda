// Give the service worker access to the Firebase App object.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
// Give the service worker access to the Firebase Messaging object.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Get the config from the URL query string.
const urlParams = new URLSearchParams(location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
        
        // Initialize the Firebase app in the service worker if it's not already initialized.
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        // Retrieve an instance of Firebase Messaging so that it can handle background messages.
        const messaging = firebase.messaging();
        
        messaging.onBackgroundMessage(function(payload) {
          console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
          // The server sends a "data" payload. We can extract the title and body from it.
          const notificationTitle = payload.data.title;
          const notificationOptions = {
            body: payload.data.body,
          };
        
          // The service worker needs to show the notification.
          self.registration.showNotification(notificationTitle, notificationOptions);
        });

    } catch (e) {
        console.error('Error parsing Firebase config in service worker', e);
    }
} else {
    console.error('Firebase config not found in service worker URL.');
}
