'use client';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A helper to check if all necessary config values are present
const isFirebaseConfigComplete = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

const app = isFirebaseConfigComplete && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);

// export const messaging = async (): Promise<Messaging | null> => {
//     if (!app || !(await isSupported())) {
//         console.log("Firebase Messaging is not supported in this browser.");
//         return null;
//     }
//     return getMessaging(app);
// };

// export const requestNotificationPermission = async () => {
//     if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
//         console.log("Service workers are not supported in this browser.");
//         return null;
//     }

//     if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
//         console.warn("VAPID key not found in environment variables. Notifications will not work.");
//         return null;
//     }

//     if (!isFirebaseConfigComplete) {
//         console.warn("Firebase client configuration is incomplete. Notifications will not work.");
//         return null;
//     }

//     try {
//         const messagingInstance = await messaging();
//         if (!messagingInstance) return null;

//         const permission = await Notification.requestPermission();
//         if (permission === 'granted') {
//             console.log('Notification permission granted.');
//             // getToken will use the default service worker file at /firebase-messaging-sw.js
//             // const token = await getToken(messagingInstance, {
//             //     vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
//             // });
//             // console.log('FCM Token obtained:', token);
//             // return token;
//             console.log('[TEST] Service worker registration via getToken is temporarily disabled.');
//             return null; // Impedisce la registrazione del SW e l'ottenimento del token
//         } else {
//             console.log('Unable to get permission to notify.');
//             return null;
//         }
//     } catch (error) {
//         console.error('An error occurred while retrieving token. ', error);
//         return null;
//     }
// };

// Le funzioni messaging e requestNotificationPermission sono state commentate
// come parte della Fase 1 della reimplementazione del sistema di notifiche.
// Saranno sostituite da una nuova logica in Fase 2.

// export const getFirebaseApp = () => {
//     return app;
// }

// --- Nuova Logica per Fase 2 ---
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Funzione per inviare la configurazione Firebase al Service Worker
function sendFirebaseConfigToSW(swRegistration: ServiceWorkerRegistration) {
    if (!self.firebaseConfig) { // self.firebaseConfig non è accessibile qui, usiamo firebaseConfig globale dello script
        console.warn('[Client] Firebase config for SW is not defined or accessible in this scope.');
        // Questo log indica un potenziale problema se firebaseConfig non è definito globalmente nel client
        // o se c'è confusione di scope. Per ora, assumiamo che firebaseConfig (l'oggetto) sia accessibile.
    }

    const config = { // Ricrea l'oggetto config dalle variabili d'ambiente
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (swRegistration.active) {
        console.log('[Client] Sending Firebase config to active SW:', config);
        swRegistration.active.postMessage({
            type: 'SET_FIREBASE_CONFIG',
            config: config,
        });
    } else if (swRegistration.installing) {
        console.log('[Client] SW is installing. Will try to send config once active.');
        // Potrebbe essere necessario attendere che il SW diventi attivo.
        // Per semplicità, questo esempio invia solo se già attivo.
        // Una soluzione più robusta attenderebbe l'attivazione.
        swRegistration.addEventListener('statechange', function(event) {
            // Nota: 'statechange' potrebbe non essere l'evento corretto o potrebbe non funzionare come previsto qui.
            // L'approccio più sicuro è che il SW richieda la config quando si attiva.
            // Tuttavia, per ora proviamo a inviare quando 'installing' e speriamo che il SW la prenda.
            if (swRegistration.active && event.target?.state === 'activated') {
                 console.log('[Client] SW became active after installing. Sending Firebase config:', config);
                 swRegistration.active.postMessage({
                    type: 'SET_FIREBASE_CONFIG',
                    config: config,
                });
            }
        });
    } else {
        console.warn('[Client] No active or installing service worker to send config to.');
    }
}


export async function initializePushNotifications(onTokenReceived: (token: string) => void) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[Client] Service workers are not supported.');
        return;
    }
    if (!app) {
        console.error('[Client] Firebase app is not initialized.');
        return;
    }
    if (!VAPID_KEY) {
        console.warn('[Client] VAPID key not found. Notifications will not work.');
        return;
    }
    if (!isFirebaseConfigComplete) { // Assumendo che isFirebaseConfigComplete sia ancora definito e accessibile
        console.warn("[Client] Firebase client configuration is incomplete. Notifications will not work.");
        return;
    }

    try {
        const swRegistration = await navigator.serviceWorker.register('/custom-firebase-sw.js');
        console.log('[Client] Service Worker registered:', swRegistration);

        // Invia la configurazione Firebase al SW appena registrato o attivato
        // È importante che il SW sia pronto a ricevere questo messaggio.
        // Diamo un piccolo timeout per dare tempo al SW di attivarsi se è la prima volta.
        // Questo è un workaround; una soluzione più robusta userebbe un handshake.
        setTimeout(() => {
            if (swRegistration.active) {
                 sendFirebaseConfigToSW(swRegistration);
            } else if (swRegistration.installing) {
                // Se è in installazione, attendi che diventi attivo
                swRegistration.installing.addEventListener('statechange', (e) => {
                    if ((e.target as ServiceWorker).state === 'activated') {
                        sendFirebaseConfigToSW(swRegistration);
                    }
                });
            } else { // Se non c'è un SW attivo o in installazione (improbabile dopo la registrazione)
                 console.warn('[Client] SW not active or installing immediately after registration. Config might not be sent.');
            }
        }, 500); // Piccolo delay


        const messagingSupported = await isSupported();
        if (!messagingSupported) {
            console.log('[Client] Firebase Messaging is not supported in this browser.');
            return;
        }

        const messagingInstance = getMessaging(app);
        console.log('[Client] Firebase Messaging instance obtained.');

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('[Client] Notification permission granted.');

            // Tenta di ottenere il token. Il SW deve essere attivo e inizializzato con Firebase.
            // Potrebbe essere necessario attendere che il SW confermi l'inizializzazione di Firebase.
            // Per ora, proviamo direttamente dopo aver inviato la config.
            console.log('[Client] Attempting to get FCM token...');
            const fcmToken = await getToken(messagingInstance, {
                serviceWorkerRegistration: swRegistration,
                vapidKey: VAPID_KEY,
            });

            if (fcmToken) {
                console.log('[Client] FCM Token obtained:', fcmToken);
                onTokenReceived(fcmToken); // Chiama il callback con il token
            } else {
                console.warn('[Client] Failed to get FCM token. SW might not be ready or initialized.');
            }
        } else {
            console.log('[Client] Notification permission denied.');
        }
    } catch (error) {
        console.error('[Client] Error during push notification initialization:', error);
    }
}
