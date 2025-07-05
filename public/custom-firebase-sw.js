// [public/custom-firebase-sw.js]

// Importa gli script di Firebase
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// Variabile globale per la configurazione Firebase, che verrà impostata dal client
self.firebaseConfig = null;
let firebaseInitialized = false;

// Funzione per inizializzare Firebase una volta che la configurazione è disponibile
function initializeFirebase() {
    if (self.firebaseConfig && !firebaseInitialized) {
        try {
            firebase.initializeApp(self.firebaseConfig);
            firebaseInitialized = true;
            console.log('[SW] Firebase initialized with config received from client.');
        } catch (e) {
            console.error('[SW] Error initializing Firebase:', e);
            // Se l'inizializzazione fallisce con "already exists", significa che è già stata inizializzata.
            // Questo può accadere se il SW viene attivato più volte.
            if (e.code === 'app/duplicate-app') {
                firebaseInitialized = true; // Considera inizializzato se l'app esiste già
            }
        }
    }
}

// Listener per i messaggi dal client (per ricevere la configurazione)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
        console.log('[SW] Received Firebase config from client:', event.data.config);
        self.firebaseConfig = event.data.config;
        initializeFirebase();
    }
});

// Evento install: il service worker viene installato
self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    event.waitUntil(self.skipWaiting()); // Attiva subito il nuovo SW
});

// Evento activate: il service worker viene attivato
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');
    event.waitUntil(self.clients.claim()); // Prende il controllo immediato delle pagine
});

// Evento push: ricezione di un messaggio push
// Questo listener verrà agganciato solo dopo l'inizializzazione di Firebase.
// Firebase messaging SDK gestisce internamente l'aggiunta del suo listener 'push'.
// Noi dobbiamo solo assicurarci che Firebase sia inizializzato.

// Se Firebase è già inizializzato quando lo script viene valutato (es. SW riattivato),
// si può tentare di inizializzare il messaging.
if (firebaseInitialized) {
    try {
        const messaging = firebase.messaging();
        console.log('[SW] Firebase Messaging object obtained (post-initialization).');

        messaging.onBackgroundMessage((payload) => {
            console.log('[SW] Background message received:', payload);

            const notificationTitle = payload.data?.notificationTitle || 'Nuova Notifica';
            const notificationTag = payload.data?.notificationTag || 'default-tag'; // Per la deduplicazione

            const notificationOptions = {
                body: payload.data?.notificationBody || 'Hai un nuovo messaggio.',
                icon: payload.data?.icon || '/favicon.ico',
                tag: notificationTag,
                renotify: true, // Se una notifica con lo stesso tag viene mostrata, notifica di nuovo l'utente
                data: payload.data // Passa tutti i dati al click event
            };

            event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
        });
    } catch(e) {
        console.error('[SW] Error setting up onBackgroundMessage (post-initialization):', e)
    }
} else {
    // Se Firebase non è ancora inizializzato, onBackgroundMessage verrà configurato
    // dall'SDK di Firebase Messaging una volta che `firebase.messaging()` viene chiamato
    // dopo l'inizializzazione. Per sicurezza, logghiamo.
    console.log('[SW] Firebase not yet initialized. onBackgroundMessage will be set up by Firebase SDK later.');
    // È importante che il client chiami getToken() che a sua volta inizializza il messaging
    // e il listener onBackgroundMessage.
}


// Evento notificationclick: l'utente clicca sulla notifica
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click received:', event.notification);
    event.notification.close(); // Chiude la notifica

    // Azione di default: apre la pagina principale o la focalizza se già aperta
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = event.notification.data?.click_action || '/'; // Usa click_action se presente, altrimenti root

            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

console.log('[SW] Service Worker loaded. Waiting for Firebase config from client via postMessage.');
