// This file must be in the public folder.

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Get Firebase config from the URL query parameter passed during registration.
const urlParams = new URL(location).searchParams;
const firebaseConfigStr = urlParams.get('firebaseConfig');

if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(firebaseConfigStr);

    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Get an instance of Firebase Messaging
    const messaging = firebase.messaging();
    
    console.log('Firebase Messaging Service Worker configured.');

    // Add a listener for the 'push' event.
    // This event is triggered when a push message is received when the app is in the background.
    self.addEventListener('push', (event) => {
      console.log('[Service Worker] Push Received.');
      
      // The data from the push event is in event.data.
      // We expect it to be a JSON string, so we parse it.
      const payload = event.data.json();
      
      console.log('[Service Worker] Push Payload: ', payload);

      // We expect the custom data to be in `payload.data`.
      const notificationTitle = payload.data.title;
      const notificationOptions = {
        body: payload.data.body,
        // icon: '/your-icon.png' // You can add an icon here
      };

      // The waitUntil() method ensures that the service worker doesn't
      // terminate before the notification is displayed.
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    });

  } catch (error) {
    console.error('Error initializing Firebase in Service Worker:', error);
  }
} else {
    console.error('Firebase config not found in service worker query string.');
}
