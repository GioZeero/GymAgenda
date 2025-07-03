import { NextResponse } from 'next/server';

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const scriptContent = `
    // Importa le versioni 'compat' delle librerie Firebase, più stabili negli ambienti Service Worker.
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

    // La configurazione di Firebase viene iniettata dinamicamente dal server.
    const firebaseConfig = ${JSON.stringify(firebaseConfig)};

    // Inizializza Firebase solo se la configurazione è valida.
    if (firebaseConfig && firebaseConfig.apiKey) {
      try {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // Imposta il gestore per i messaggi ricevuti quando l'app è in background.
        messaging.onBackgroundMessage((payload) => {
          console.log('[SW] Messaggio ricevuto in background: ', payload);

          // Estrai titolo e corpo personalizzati dai dati del messaggio.
          const notificationTitle = payload.data.notificationTitle;
          const notificationOptions = {
            body: payload.data.notificationBody,
          };

          // Mostra la notifica personalizzata.
          self.registration.showNotification(notificationTitle, notificationOptions);
        });
      } catch(e) {
        console.error('[SW] Errore durante l\\'inizializzazione di Firebase:', e);
      }
    } else {
      console.log('[SW] Configurazione Firebase non trovata. Impossibile inizializzare.');
    }
  `;

  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // Questa intestazione di caching è cruciale per prevenire la ri-registrazione costante del service worker.
      // Dice al browser di usare la versione in cache per 1 giorno prima di ricontrollare.
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    },
  });
}
