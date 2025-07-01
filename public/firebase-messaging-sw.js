// Import the Firebase scripts for the service worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// A helper function to parse query parameters from the service worker's URL
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(self.location.search);
  return urlParams.get(param);
};

// Get the firebaseConfig JSON from the query parameter
const firebaseConfigParam = getQueryParam('firebaseConfig');

if (firebaseConfigParam) {
  // Parse the config object
  const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
  
  // Initialize Firebase with the parsed config
  firebase.initializeApp(firebaseConfig);

  // Retrieve an instance of Firebase Messaging to handle background messages.
  const messaging = firebase.messaging();

  // Set up the background message handler.
  // This is triggered when the app is in the background or closed.
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);

    // Extract the title and body from the data payload sent from the server.
    const notificationTitle = payload.data.title;
    const notificationOptions = {
      body: payload.data.body,
      icon: '/icon.png', // Optional: You can add an icon.png to your /public folder
    };

    // Display the notification to the user.
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('Firebase config not found in service worker. Notifications will not work.');
}

