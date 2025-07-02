// These scripts are required for the Firebase SDK to work.
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// This is the function that will be called when the SW is registered.
// It initializes Firebase.
function initializeFirebase() {
    try {
        // self.location gives us the URL of the SW script, including query params.
        const urlParams = new URLSearchParams(self.location.search);
        const firebaseConfigStr = urlParams.get('firebaseConfig');
        
        if (!firebaseConfigStr) {
            console.error("[SW] Firebase config not found in the query string. This is required for notifications to work. Please ensure the service worker is registered correctly.");
            return null; // Return null if config is missing
        }

        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
        
        // Initialize the Firebase app in the service worker
        const app = firebase.initializeApp(firebaseConfig);
        console.log("[SW] Firebase initialized successfully.");
        
        // Return the messaging instance
        return firebase.messaging(app);

    } catch (e) {
        console.error("[SW] Error during Firebase initialization: ", e);
        return null;
    }
}

// Initialize Firebase and get the messaging instance.
const messaging = initializeFirebase();

// If initialization was successful, set up the background message handler.
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message: ', payload);
    
        // Check if the payload has the data we expect.
        if (!payload || !payload.data || !payload.data.title) {
            console.log("[SW] Received a push message without the expected data format.");
            return;
        }
        
        const notificationTitle = payload.data.title;
        const notificationOptions = {
            body: payload.data.body,
            icon: '/icon-192x192.png', // A default icon for the notification
        };
    
        // Show the notification.
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}
