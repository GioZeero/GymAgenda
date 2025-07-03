'use client';
import { useEffect } from 'react';

// This component is kept to avoid breaking imports, but its functionality
// is now handled automatically by the Firebase SDK's getToken() method,
// which registers the default '/firebase-messaging-sw.js'.
// This prevents conflicting service worker registrations.
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        // No action is needed here anymore. The registration is triggered
        // within requestNotificationPermission() when the user logs in.
    }, []);

    return null;
}
