import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function getServiceAccount(): admin.ServiceAccount {
  // Bypassing environment variables for local build debugging.
  // Force use of the local file.

  // Production-first Method: Use a Base64 encoded service account from env variables.
  // if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  //   try {
  //     const decodedServiceAccount = Buffer.from(
  //       process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  //       'base64'
  //     ).toString('utf8');
  //     const serviceAccount = JSON.parse(decodedServiceAccount);
  //     if ((serviceAccount as any).private_key) {
  //       (serviceAccount as any).private_key = (serviceAccount as any).private_key.replace(/\\n/g, '\n');
  //     }
  //     return serviceAccount;
  //   } catch (e) {
  //     console.error('Error parsing Base64 decoded service account:', e);
  //     throw new Error('Could not parse Base64 decoded service account.');
  //   }
  // }

  // Legacy Method: Use the raw JSON from the environment variable.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('Found FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
    const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // Log a sanitized check of the variable's content
    console.log(`Variable starts with "{" and ends with "}": ${jsonString.startsWith('{') && jsonString.endsWith('}')}`);

    try {
      // Define a partial type for the service account to satisfy TypeScript linter
      interface PartialServiceAccount {
        private_key?: string;
        [key: string]: unknown; // Allow other properties
      }

      const serviceAccount: PartialServiceAccount = JSON.parse(jsonString);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      console.log('Successfully parsed service account JSON.');
      return serviceAccount as admin.ServiceAccount;
    } catch (e) {
      console.error('CRITICAL: Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', e);
      // Log the first 10 and last 10 characters to help debug without exposing the whole key
      console.error(`Sanitized variable content (start): ${jsonString.substring(0, 10)}`);
      console.error(`Sanitized variable content (end): ${jsonString.substring(jsonString.length - 10)}`);
      throw new Error(
        'Could not parse Firebase service account credentials from environment variable.'
      );
    }
  } else {
    console.log('Did not find FIREBASE_SERVICE_ACCOUNT_JSON environment variable. Falling back to local file.');
  }

  // Fallback for local development: Read the local key file.
  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      'ai-jobs-spot-firebase-adminsdk-fbsvc-80630fc4ef.json'
    );
    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    return JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      'Could not find ai-jobs-spot-bc835af65f64.json and no service account environment variables are set.'
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
