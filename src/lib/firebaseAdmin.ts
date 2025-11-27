import admin from 'firebase-admin';



// A promise to hold the initialized admin services.
let adminPromise: Promise<{
  admin: typeof admin;
  adminApp: admin.app.App;
  adminDb: admin.firestore.Firestore;
  adminAuth: admin.auth.Auth;
}> | null = null;

import fs from 'fs/promises';

async function getServiceAccount(): Promise<admin.ServiceAccount> {
  // 1. Try to build from individual environment variables (most robust for CI/CD)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      console.log('Using individual Firebase environment variables for Firebase Admin.');
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };
    } catch (e) {
      console.error('Error constructing service account from individual environment variables:', e);
      // Fall through to the next method
    }
  }

  // 2. Fallback to parsing a Base64 encoded JSON from an environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      console.log('Using FIREBASE_SERVICE_ACCOUNT_B64 environment variable for Firebase Admin.');
      const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      const serviceAccountJSON = JSON.parse(decodedJson);
      return {
        clientEmail: serviceAccountJSON.client_email,
        privateKey: serviceAccountJSON.private_key,
        projectId: serviceAccountJSON.project_id,
      } as admin.ServiceAccount;
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_B64 environment variable:', e);
      // Fall through to the next method
    }
  }

  // 3. Fallback to local JSON file for local development
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './ai-jobs-spot-92a1f1a8b08e.json'; // Use GOOGLE_APPLICATION_CREDENTIALS if set, otherwise default
    const serviceAccountFile = await fs.readFile(serviceAccountPath, 'utf8');
    const serviceAccountJSON = JSON.parse(serviceAccountFile);
    console.log(`Using local JSON file for Firebase Admin: ${serviceAccountPath}`);
    return {
      clientEmail: serviceAccountJSON.client_email,
      privateKey: serviceAccountJSON.private_key,
      projectId: serviceAccountJSON.project_id,
    } as admin.ServiceAccount;
  } catch (e) {
    console.error('Error reading or parsing local service account file:', e);
    throw new Error('Could not load service account. Ensure local file exists or environment variables (FIREBASE_PROJECT_ID, etc. or FIREBASE_SERVICE_ACCOUNT_B64) are set.');
  }
}

async function initializeAdminApp(): Promise<admin.app.App> {
  const existingApp = admin.apps.find((app) => app?.name === 'ADMIN');
  if (existingApp) {
    return existingApp;
  }

  try {
    const serviceAccount = await getServiceAccount();
    const newApp = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
      },
      'ADMIN'
    );
    console.log('Firebase Admin SDK initialized successfully.');
    return newApp;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Firebase Admin SDK initialization error:', error.stack);
    } else {
      console.error('An unknown error occurred during Firebase Admin SDK initialization:', error);
    }
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}

/**
 * Gets the initialized Firebase Admin SDK instances.
 * The initialization is memoized, so it only happens once.
 * @returns A promise that resolves to the admin services.
 */
export const getFirebaseAdmin = () => {
  if (!adminPromise) {
    adminPromise = new Promise(async (resolve, reject) => {
      console.log('[getFirebaseAdmin] Initializing Firebase Admin services...');
      try {
        const app = await initializeAdminApp();
        console.log('[getFirebaseAdmin] Admin app initialized. Getting Firestore instance...');
        const db = app.firestore();
        const auth = app.auth();
        console.log('[getFirebaseAdmin] Firebase Admin services are ready.');
        resolve({ admin, adminApp: app, adminDb: db, adminAuth: auth });
      } catch (e) {
        console.error('[getFirebaseAdmin] Failed to initialize Firebase Admin services:', e);
        reject(e);
      }
    });
  }
  return adminPromise;
};






// Export the admin namespace directly for convenience
export { admin };
