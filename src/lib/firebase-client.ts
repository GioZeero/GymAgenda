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

export const messaging = async (): Promise<Messaging | null> => {
    if (!app || !(await isSupported())) {
        return null;
    }
    return getMessaging(app);
};

export const requestNotificationPermission = async () => {
    const isClient = typeof window !== 'undefined';
    // Ensure service workers are supported
    if (!isClient || !('serviceWorker' in navigator)) {
        console.log("Service workers are not supported in this browser.");
        return null;
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        console.warn("VAPID key not found in environment variables. Notifications will not work.");
        return null;
    }
    
    if (!isFirebaseConfigComplete) {
        console.warn("Firebase client configuration is incomplete. Notifications will not work.");
        return null;
    }

    try {
        const messagingInstance = await messaging();
        if (!messagingInstance) {
            console.log("Firebase Messaging is not supported in this browser.");
            return null;
        }

        // 1. Manually register our static service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered manually:', registration);

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // 2. Pass our own registration to getToken to prevent Firebase from re-registering
            const token = await getToken(messagingInstance, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
            });
            console.log('FCM Token obtained using manual registration:', token);
            return token;
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token or registering service worker. ', error);
        return null;
    }
};
