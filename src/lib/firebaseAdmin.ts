import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

async function getServiceAccount(): Promise<admin.ServiceAccount> {
  // Method 1: Use local JSON file (for local development)
  // This is prioritized to ensure local development uses the file directly.
  try {
    const keyFilePath = path.join(process.cwd(), 'ai-jobs-spot-92a1f1a8b08e.json');
    if (fs.existsSync(keyFilePath)) {
      console.log('Using local service account file for Firebase Admin.');
      const serviceAccountString = fs.readFileSync(keyFilePath, 'utf8');
      const serviceAccountJSON = JSON.parse(serviceAccountString);
      return {
        clientEmail: serviceAccountJSON.client_email,
        privateKey: serviceAccountJSON.private_key,
        projectId: serviceAccountJSON.project_id,
      } as admin.ServiceAccount;
    }
  } catch (e) {
    console.error('Error reading or parsing local service account file:', e);
    // Fall through to the next method if local file fails
  }

  // Method 2: Use Base64 environment variable (for Vercel/production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decodedServiceAccount = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');
      const serviceAccountJSON = JSON.parse(decodedServiceAccount);
      // The private key in the environment variable might have escaped newlines
      if (typeof serviceAccountJSON.private_key === 'string') {
        serviceAccountJSON.private_key = serviceAccountJSON.private_key.replace(/\\n/g, '\n');
      }
      console.log('Using environment variable for Firebase Admin.');
      return {
        clientEmail: serviceAccountJSON.client_email,
        privateKey: serviceAccountJSON.private_key,
        projectId: serviceAccountJSON.project_id,
      } as admin.ServiceAccount;
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
      // Fall through to the final error
    }
  }
  
  // If all methods fail, throw a comprehensive error
  throw new Error(
    'Firebase Admin SDK credentials are not set or are invalid. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 (for production) or ensure a valid ai-jobs-spot-92a1f1a8b08e.json file exists at the project root (for local development).'
  );
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
      console.error(
        'An unknown error occurred during Firebase Admin SDK initialization:',
        error
      );
    }
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}

let adminApp: admin.app.App;
let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

(async () => {
  adminApp = await initializeAdminApp();
  adminDb = adminApp.firestore();
  adminAuth = adminApp.auth();
})();

export { admin, adminApp, adminDb, adminAuth };
