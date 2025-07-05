import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin'; // Riattivato import

export async function POST(request: Request) {
  try {
    const { name, role, token } = await request.json();

    if (!name || !role || !token) {
      return NextResponse.json({ success: false, error: 'Missing required fields (name, role, token)' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    // Usiamo il token come ID del documento per garantire l'unicità della sottoscrizione per token
    // e facilitare la rimozione se il token diventa invalido.
    // Potremmo voler indicizzare per utente/nome in aggiunta se necessario per query specifiche.
    const subscriptionRef = adminDb.collection('subscriptions').doc(token);
    
    await subscriptionRef.set({
      name, // Nome dell'utente/dispositivo (opzionale, ma utile per debug)
      role, // Ruolo per il targeting
      token, // Token FCM
      subscribedAt: new Date().toISOString(),
    }, { merge: true }); // Merge true per aggiornare se esiste già con lo stesso token

    console.log(`[API Subscribe] Token ${token} for role ${role} (user ${name}) saved/updated.`);
    return NextResponse.json({ success: true, message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('[API Subscribe] Error saving subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
