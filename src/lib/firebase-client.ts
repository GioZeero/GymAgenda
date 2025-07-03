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
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    return getMessaging(app);
};

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
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
        if (!messagingInstance) return null;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // getToken will use the default service worker file at /firebase-messaging-sw.js
            const token = await getToken(messagingInstance, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            console.log('FCM Token obtained:', token);
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
