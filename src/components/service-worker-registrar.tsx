'use client';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/firebase-client';

export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerServiceWorker();
        }
    }, []);

    return null;
}
