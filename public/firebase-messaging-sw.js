// Scripts for Firebase v9 compat library are easier for service workers
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(self.location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    try {
        const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
        
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }

        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message ', payload);
            
            if (payload.notification) {
                const notificationTitle = payload.notification.title;
                const notificationOptions = {
                    body: payload.notification.body,
                };
                self.registration.showNotification(notificationTitle, notificationOptions);
            }
        });
    } catch(e) {
        console.error("Error initializing Firebase in service worker", e);
    }
} else {
    console.error("Firebase config not found in service worker query parameters.");
}
