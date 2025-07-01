import { NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { targetRole, title, body } = await request.json();

    if (!targetRole || !title || !body) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();

    const subscriptionsSnapshot = await adminDb.collection('subscriptions').where('role', '==', targetRole).get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'No subscriptions found for the target role.' });
    }

    const tokens = subscriptionsSnapshot.docs.map(doc => doc.data().token).filter(token => token);

    if (tokens.length === 0) {
        return NextResponse.json({ success: true, message: 'No valid tokens found.' });
    }
    
    // FCM has a limit of 500 tokens per multicast message
    const tokenChunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
        tokenChunks.push(tokens.slice(i, i + 500));
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    let successCount = 0;
    let failureCount = 0;
    const tokensToDelete: string[] = [];

    for (const chunk of tokenChunks) {
        const response = await adminMessaging.sendEachForMulticast({ ...message, tokens: chunk });
        successCount += response.successCount;
        failureCount += response.failureCount;

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send to token: ${chunk[idx]}`, resp.error);
                    const errorCode = resp.error?.code;
                    // Check for errors that indicate an invalid or unregistered token
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        tokensToDelete.push(chunk[idx]);
                    }
                }
            });
        }
    }

    // After the loop, delete all the invalid tokens found
    if (tokensToDelete.length > 0) {
        console.log(`Deleting ${tokensToDelete.length} invalid tokens...`);
        const subscriptionsRef = adminDb.collection('subscriptions');
        // Firestore 'in' query can handle up to 30 items at a time
        const deleteBatches: Promise<any>[] = [];
        for (let i = 0; i < tokensToDelete.length; i += 30) {
            const batchTokens = tokensToDelete.slice(i, i + 30);
            const q = subscriptionsRef.where('token', 'in', batchTokens);
            const deletePromise = q.get().then(snapshot => {
                if (snapshot.empty) return;
                const batch = adminDb.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            });
            deleteBatches.push(deletePromise);
        }
        await Promise.all(deleteBatches).catch(err => {
            console.error("Error batch deleting invalid tokens:", err);
        });
    }

    return NextResponse.json({ success: true, successCount, failureCount });

  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
