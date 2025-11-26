
import { getFirebaseAdmin, admin } from './src/lib/firebaseAdmin.cts';

async function deletePendingJobs() {
  console.log('Connecting to Firebase...');
  const { adminDb } = await getFirebaseAdmin();
  const jobsRef = adminDb.collection('jobs');

  console.log('Querying for jobs with status: pending_review...');
  const snapshot = await jobsRef.where('status', '==', 'pending_review').get();

  if (snapshot.empty) {
    console.log('No pending jobs found to delete.');
    return;
  }

  const batchSize = 400;
  let batch = adminDb.batch();
  let count = 0;

  console.log(`Found ${snapshot.size} pending jobs. Starting deletion...`);

  snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot, index: number) => {
    batch.delete(doc.ref);
    count++;
    if (count % batchSize === 0 || index === snapshot.size - 1) {
      console.log(`Committing batch to delete ${count} jobs...`);
      batch.commit().then(() => {
        console.log(`Batch committed.`);
      });
      batch = adminDb.batch();
      count = 0;
    }
  });

  console.log('Deletion process initiated.');
}

deletePendingJobs().then(() => {
  console.log('Cleanup script finished.');
  process.exit(0);
}).catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});
