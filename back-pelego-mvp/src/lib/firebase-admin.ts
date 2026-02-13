import * as admin from 'firebase-admin';
import * as path from 'path';

if (!admin.apps.length) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credPath) {
    // Use explicit service account credentials
    const resolvedPath = path.isAbsolute(credPath) ? credPath : path.resolve(credPath);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'pelego-v2',
    });
    console.log('Firebase Admin initialized with service account credentials.');
  } else {
    // Fallback to Application Default Credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'pelego-v2',
    });
    console.warn(
      'WARNING: GOOGLE_APPLICATION_CREDENTIALS not set. Using Application Default Credentials.',
    );
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };
