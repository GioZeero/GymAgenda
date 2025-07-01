// This file must be in the public folder.
// It is imported and registered by the client.

// We need to import the Firebase SDKs
try {
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');
    
    // Get the Firebase config from the query string
    const urlParams = new URLSearchParams(location.search);
    const firebaseConfigParam = urlParams.get('firebaseConfig');
    
    if (!firebaseConfigParam) {
        throw new Error("Firebase config not found in service worker query string.");
    }

    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
    
    firebase.initializeApp(firebaseConfig);
    
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/dumbbell-icon.png' // You can create and place this icon in /public
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });

} catch (e) {
    console.error("Error in service worker:", e);
}
