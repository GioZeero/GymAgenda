// These scripts are imported from the web, not from node_modules.
// Use versions compatible with the Firebase SDK version in package.json
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// This is a special variable that gives us access to the service worker's URL.
const urlParams = new URL(self.location).searchParams;
const firebaseConfigStr = urlParams.get('firebaseConfig');

if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
    
    // Initialize the Firebase app in the service worker with the config.
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
      );

      // Customize the notification here from the payload
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        // You can add an icon here, e.g., icon: '/icon.png'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch(e) {
    console.error("Error initializing Firebase in service worker", e);
  }
} else {
  console.error("Firebase config not found in service worker query params.");
}
