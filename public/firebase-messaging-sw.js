// NOTA: questo file deve trovarsi nella cartella `public`.
// Viene registrato da `src/lib/firebase-client.ts`.

// Questi script sono necessari per far funzionare Firebase in un service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Il service worker viene caricato con un parametro query contenente la configurazione di Firebase.
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfigParam = urlParams.get('firebaseConfig');

if (firebaseConfigParam) {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
    
    // Inizializza Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    
        const messaging = firebase.messaging();
    
        // Questo gestore verrà chiamato quando viene ricevuta una notifica push
        // mentre l'app è in background.
        messaging.onBackgroundMessage((payload) => {
          console.log('[firebase-messaging-sw.js] Ricevuto messaggio in background ', payload);
          
          if (payload.notification) {
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
              body: payload.notification.body,
              // Puoi aggiungere un'icona qui se ne hai una nella tua cartella public.
              // Esempio: icon: '/icon-192.png'
            };
      
            self.registration.showNotification(notificationTitle, notificationOptions);
          }
        });
    }
} else {
    console.error('Configurazione Firebase non trovata nei parametri query del service worker.');
}
