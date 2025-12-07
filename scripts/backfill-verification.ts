import * as dotenv from 'dotenv';
import path from 'path';
import * as admin from 'firebase-admin';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getFirebaseAdmin } from '../src/lib/firebaseAdmin';

/**
 * A one-time script to backfill `verificationHistory` for existing jobs.
 * It takes the existing `verificationDate` and creates the first event
 * in the `verificationHistory` array.
 */
async function backfillVerificationHistory() {
  console.log('Starting verification history backfill...');
  
  const { adminDb } = await getFirebaseAdmin();
  const jobsCollection = adminDb.collection('jobs');
  const snapshot = await jobsCollection.get();

  if (snapshot.empty) {
    console.log('No jobs found. Exiting.');
    return;
  }

  const batch = adminDb.batch();
  let updatedCount = 0;

  snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const job = doc.data();
    const hasDate = job.verificationDate;
    const hasHistory = job.verificationHistory && Array.isArray(job.verificationHistory) && job.verificationHistory.length > 0;


    // Only update if there's a date but no history
    if (hasDate && !hasHistory) {
      console.log(`Updating job: ${doc.id}`);
      const newHistory = [
        {
          date: job.verificationDate, // This is already a Timestamp object
          type: 'manual', // Assume older ones were manual
          verifier: 'System-Backfill',
          note: 'Created from legacy verificationDate field.',
        },
      ];
      
      batch.update(doc.ref, { verificationHistory: newHistory });
      updatedCount++;
    }
  });

  if (updatedCount === 0) {
    console.log('No jobs needed updating. All documents seem to have a verification history already.');
    return;
  }

  console.log(`Found ${updatedCount} jobs to update. Committing batch...`);
  await batch.commit();
  console.log(`Successfully backfilled verification history for ${updatedCount} jobs.`);
}

backfillVerificationHistory()
  .then(() => {
    console.log('Backfill script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill script failed:', error);
    process.exit(1);
  });
