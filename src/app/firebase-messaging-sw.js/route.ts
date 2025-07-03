import { NextResponse } from 'next/server';

export async function GET() {
  // This dynamic route is deprecated and should not be used.
  // The service worker is now served from the static `/public/firebase-messaging-sw.js` file.
  // This route is kept to avoid 404 errors from older cached clients, but it does nothing.
  const scriptContent = `// This service worker is deprecated. Please clear your browser cache and reload.`;
  
  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
