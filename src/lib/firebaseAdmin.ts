import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Declare global variables for caching
let adminApp: admin.app.App;
let adminDb: admin.firestore.Firestore;
let serviceAccount: admin.ServiceAccount | undefined;

function getServiceAccount(): admin.ServiceAccount {
  // Return cached version if it exists
  if (serviceAccount) {
    return serviceAccount;
  }

  // Use environment variable in production for security.
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
    return serviceAccount as admin.ServiceAccount;
  }

  // Fallback to a local file for development.
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.local.json');
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return serviceAccount as admin.ServiceAccount;
  }

  throw new Error('serviceAccountKey.local.json not found and FIREBASE_SERVICE_ACCOUNT_BASE64 is not set.');
}

if (!admin.apps.length) {
  try {
    const cert = getServiceAccount();
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(cert),
    }, 'adminApp'); // Give it a unique name to avoid conflicts
    adminDb = adminApp.firestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    throw new Error("Could not initialize Firebase Admin SDK.");
  }
} else {
  adminApp = admin.app('adminApp');
  adminDb = adminApp.firestore();
}

export { admin, adminApp, adminDb };
