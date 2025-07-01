import admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines for Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.warn("Firebase admin credentials not found or incomplete in environment variables. Skipping admin initialization.");
        return null;
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    return null;
  }
};

const adminApp = initializeAdmin();

// Export getter functions instead of the raw objects
export const getAdminDb = () => {
  if (!adminApp) {
    throw new Error("Firebase Admin SDK not initialized. Check server logs for details.");
  }
  return adminApp.firestore();
};

export const getAdminMessaging = () => {
  if (!adminApp) {
    throw new Error("Firebase Admin SDK not initialized. Check server logs for details.");
  }
  return adminApp.messaging();
};
