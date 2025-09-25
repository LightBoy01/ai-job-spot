import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function getServiceAccount(): admin.ServiceAccount {
  // Primary Method: Use the raw JSON from the environment variable.
  // This is more reliable than Base64 encoding for multi-line keys.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', e);
      throw new Error(
        'Could not parse Firebase service account credentials from environment variable.'
      );
    }
  }

  // Fallback for local development: Read the local key file.
  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      'serviceAccountKey.local.json'
    );
    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    return JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      'Could not find serviceAccountKey.local.json and FIREBASE_SERVICE_ACCOUNT_JSON is not set.'
    );
  }
}

function initializeAdminApp(): admin.app.App {
  const existingApp = admin.apps.find((app) => app?.name === 'ADMIN');
  if (existingApp) {
    return existingApp;
  }

  try {
    const serviceAccount = getServiceAccount();
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

const adminApp = initializeAdminApp();
const adminDb = adminApp.firestore();
const adminAuth = adminApp.auth();

export { admin, adminApp, adminDb, adminAuth };
