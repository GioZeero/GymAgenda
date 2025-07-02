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
    
    const tokenChunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
        tokenChunks.push(tokens.slice(i, i + 500));
    }

    const message = {
      data: {
        notificationTitle: title,
        notificationBody: body,
      },
    };

    let successCount = 0;
    let failureCount = 0;
    const tokensToDelete: string[] = [];

    for (const chunk of tokenChunks) {
        const response = await adminMessaging.sendEachForMulticast({ data: message.data, tokens: chunk });
        successCount += response.successCount;
        failureCount += response.failureCount;

        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send to token: ${chunk[idx]}`, resp.error);
                    const errorCode = resp.error?.code;
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

    if (tokensToDelete.length > 0) {
        console.log(`Found ${tokensToDelete.length} invalid tokens to clean up.`);
        const batch = adminDb.batch();
        const subscriptionsRef = adminDb.collection('subscriptions');
        
        // Firestore 'in' query is limited to 30 items, so we process in chunks if necessary
        const deleteChunks = [];
        for (let i = 0; i < tokensToDelete.length; i += 30) {
            deleteChunks.push(tokensToDelete.slice(i, i + 30));
        }

        for (const deleteChunk of deleteChunks) {
            const q = subscriptionsRef.where('token', 'in', deleteChunk);
            const snapshot = await q.get();
            snapshot.docs.forEach(doc => {
                console.log(`Queueing deletion for doc: ${doc.id}`);
                batch.delete(doc.ref);
            });
        }
        
        await batch.commit();
        console.log(`Finished invalid token cleanup process. Deleted subscriptions for ${tokensToDelete.length} tokens.`);
    }

    return NextResponse.json({ success: true, successCount, failureCount });

  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
