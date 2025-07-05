import { NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin'; // Riattivato imports

export async function POST(request: Request) {
  try {
    // notificationTag è aggiunto per la deduplicazione lato client
    const { targetRole, title, body, notificationTag, click_action } = await request.json();

    if (!targetRole || !title || !body) {
      return NextResponse.json({ success: false, error: 'Missing required fields (targetRole, title, body)' }, { status: 400 });
    }
    if (!notificationTag) {
        // Assegna un tag di default se non fornito, ma è meglio che sia significativo
        console.warn('[API Notify] notificationTag not provided. Using a default tag.');
    }

    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();

    const subscriptionsSnapshot = await adminDb.collection('subscriptions').where('role', '==', targetRole).get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ success: true, message: `No subscriptions found for target role: ${targetRole}` });
    }

    const tokens = subscriptionsSnapshot.docs.map(doc => doc.data().token).filter(token => token);

    if (tokens.length === 0) {
        return NextResponse.json({ success: true, message: `No valid FCM tokens found for role: ${targetRole}` });
    }
    
    // FCM supporta l'invio fino a 500 token per chiamata multicast
    const tokenChunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
        tokenChunks.push(tokens.slice(i, i + 500));
    }

    // Costruisci il payload del messaggio FCM
    // Tutti i dati personalizzati devono essere nel campo 'data'
    const messagePayload = {
      data: {
        notificationTitle: title,
        notificationBody: body,
        notificationTag: notificationTag || `role-${targetRole}-${Date.now()}`, // Tag per deduplicazione
        ...(click_action && { click_action: click_action }) // Aggiunge click_action se fornito
        // Aggiungi qui altri dati custom se necessario (es. icona, suono, ecc.)
      },
      // NOTA: Non impostare il campo 'notification' qui se vuoi che onBackgroundMessage
      // nel service worker gestisca sempre la visualizzazione della notifica,
      // specialmente se vuoi passare dati custom alla notifica.
      // Se il campo 'notification' è presente, su alcune piattaforme (es. Android quando l'app è in background)
      // il sistema potrebbe gestire la notifica automaticamente bypassando onBackgroundMessage.
    };

    let successCount = 0;
    let failureCount = 0;
    const tokensToDelete: string[] = [];

    console.log(`[API Notify] Sending message to ${tokens.length} tokens for role ${targetRole}. Payload data:`, messagePayload.data);

    for (const chunk of tokenChunks) {
        const response = await adminMessaging.sendEachForMulticast({ ...messagePayload, tokens: chunk });
        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`[API Notify] Failed to send to token: ${chunk[idx]}`, resp.error);
                // Controlla i codici di errore per token non validi o non registrati
                const errorCode = resp.error?.code;
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/mismatched-credential' // Spesso indica un token non valido per il sender ID
                ) {
                    tokensToDelete.push(chunk[idx]);
                }
            }
        });
    }

    console.log(`[API Notify] Send result - Success: ${successCount}, Failure: ${failureCount}`);

    // Pulizia dei token invalidi dal database
    if (tokensToDelete.length > 0) {
        console.log(`[API Notify] Found ${tokensToDelete.length} invalid tokens to clean up.`);
        const batch = adminDb.batch();
        // Poiché l'ID del documento è il token stesso nella collezione 'subscriptions'
        tokensToDelete.forEach(token => {
            const subRef = adminDb.collection('subscriptions').doc(token);
            batch.delete(subRef);
        });
        await batch.commit();
        console.log(`[API Notify] Finished invalid token cleanup. Deleted subscriptions for ${tokensToDelete.length} tokens.`);
    }

    return NextResponse.json({ success: true, successCount, failureCount });

  } catch (error) {
    console.error('[API Notify] Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
