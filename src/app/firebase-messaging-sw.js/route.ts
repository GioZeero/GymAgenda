import { NextResponse } from 'next/server';

// This dynamic route has been replaced by the static file in /public/firebase-messaging-sw.js
// It is intentionally left blank to avoid conflicts and unpredictable browser behavior.
export async function GET() {
  const scriptContent = `/* 
    This service worker is intentionally left blank.
    The active service worker is now located at /firebase-messaging-sw.js 
    (served from the /public directory).
  */`;
  
  return new Response(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}
