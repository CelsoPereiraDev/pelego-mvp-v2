import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'pelego-v2',
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };
