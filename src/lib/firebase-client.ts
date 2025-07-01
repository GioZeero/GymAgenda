'use client';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const messaging = async () => (await isSupported()) ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
    const isClient = typeof window !== 'undefined';
    if (!isClient) return null;

    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        console.warn("VAPID key not found in .env.local. Notifications will not work.");
        return null;
    }

    try {
        const messagingInstance = await messaging();
        if (!messagingInstance) {
            console.log("Firebase Messaging is not supported in this browser.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messagingInstance, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
            console.log('FCM Token:', token);
            return token;
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
    }
};

export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        // Pass the config as a query parameter to the service worker
        const config = encodeURIComponent(JSON.stringify(firebaseConfig));
        navigator.serviceWorker
            .register(`/firebase-messaging-sw.js?firebaseConfig=${config}`)
            .then((registration) => {
                console.log('Service Worker registration successful, scope is:', registration.scope);
            })
            .catch((err) => {
                console.log('Service Worker registration failed:', err);
            });
    }
};
