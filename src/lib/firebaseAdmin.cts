import type * as FirebaseAdmin from 'firebase-admin';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// A promise to hold the initialized admin services.
let adminPromise: Promise<{ 
  admin: typeof admin;
  adminApp: FirebaseAdmin.app.App;
  adminDb: FirebaseAdmin.firestore.Firestore;
  adminAuth: FirebaseAdmin.auth.Auth;
}> | null = null;

async function getServiceAccount(): Promise<FirebaseAdmin.ServiceAccount> {
  // Method 1: Use local JSON file (for local development)
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
      } as FirebaseAdmin.ServiceAccount;
    }
  } catch (e) {
    console.error('Error reading or parsing local service account file:', e);
  }

  // Method 2: Use Base64 environment variable (for Vercel/production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decodedServiceAccount = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');
      const serviceAccountJSON = JSON.parse(decodedServiceAccount);
      if (typeof serviceAccountJSON.private_key === 'string') {
        serviceAccountJSON.private_key = serviceAccountJSON.private_key.replace(/\\n/g, '\n');
      }
      console.log('Using environment variable for Firebase Admin.');
      return {
        clientEmail: serviceAccountJSON.client_email,
        privateKey: serviceAccountJSON.private_key,
        projectId: serviceAccountJSON.project_id,
      } as FirebaseAdmin.ServiceAccount;
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
    }
  }
  
  throw new Error(
    'Firebase Admin SDK credentials not set or invalid. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide a valid service account JSON file.'
  );
}

async function initializeAdminApp(): Promise<FirebaseAdmin.app.App> {
  const existingApp = admin.apps.find((app: FirebaseAdmin.app.App | null) => app?.name === 'ADMIN');
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

const getFirebaseAdmin = () => {
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

export { getFirebaseAdmin, admin };