import { NextResponse } from 'next/server';

// This dynamic route is no longer used and is intentionally left blank.
// The active service worker is now the static file located at /public/firebase-messaging-sw.js.
// This route is kept to prevent 404 errors from old cached versions of the site.
export async function GET() {
  const scriptContent = `/* This service worker is deprecated. The active service worker is at /firebase-messaging-sw.js */`;
  
  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}
