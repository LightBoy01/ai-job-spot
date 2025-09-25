// setAdminClaim.js
// Run this script in a secure, trusted environment (e.g., your local machine, a Cloud Function)
// NOT directly in your Next.js frontend.

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- Grand Mind Rule: Seek First to Understand ---
// This script grants a Firebase user the 'admin: true' custom claim.
// This claim is checked by your Next.js API routes (via src/lib/middleware.ts)
// and your Firestore Security Rules (firestore.rules) to authorize write operations.

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      'serviceAccountKey.local.json'
    );
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        'serviceAccountKey.local.json not found in the script directory.'
      );
    }
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully from local key.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    process.exit(1); // Exit if initialization fails
  }
}

// --- IMPORTANT: REPLACE THIS WITH THE EMAIL OF THE USER YOU WANT TO MAKE AN ADMIN ---
const userEmail = 'mikailnururahman@gmail.com';

async function setAdminClaim() {
  try {
    const userRecord = await admin.auth().getUserByEmail(userEmail);
    // Set the custom claim 'admin: true'
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log(`Custom claim 'admin: true' set for user: ${userEmail}`);
    console.log(
      '--------------------------------------------------------------------------------'
    );
    console.log(
      'IMPORTANT: The user needs to log out of the AI Job Spot admin panel and log back in,'
    );
    console.log(
      'or wait for their ID token to refresh (up to 1 hour), for this change to take effect on the client-side.'
    );
    console.log(
      '--------------------------------------------------------------------------------'
    );
  } catch (error) {
    console.error('Error setting custom claim:', error);
    if (error.code === 'auth/user-not-found') {
      console.error(
        `User with email "${userEmail}" not found in Firebase Authentication.`
      );
      console.error(
        'Please ensure the email address is correct and the user exists in your Firebase project.'
      );
    }
  }
}

setAdminClaim();
