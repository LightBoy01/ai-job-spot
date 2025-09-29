import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.ts';

/**
 * This script finds job postings with a 'pending_approval' status
 * and updates them to 'published'.
 */
async function publishApprovedJobs() {
  console.log('Starting job publishing process...');
  const { adminDb } = await getFirebaseAdmin();

  const jobsToPublishRef = adminDb.collection('jobs');
  const query = jobsToPublishRef.where('status', '==', 'pending_approval');

  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('No jobs found with status \'pending_approval\'. Nothing to do.');
      return;
    }

    console.log(`Found ${snapshot.size} jobs to publish.`);

    // Firestore allows up to 500 operations in a single batch.
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      console.log(` - Publishing job: ${doc.id}`);
      const docRef = jobsToPublishRef.doc(doc.id);
      batch.update(docRef, { status: 'published' });
    });

    await batch.commit();
    console.log(`Successfully published ${snapshot.size} jobs.`);

  } catch (error) {
    console.error('Error during job publishing process:', error);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (process.env.NODE_ENV !== 'test') {
  publishApprovedJobs()
    .then(() => {
      console.log('\nJob publishing process completed successfully.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nJob publishing process failed.\n', error);
      process.exit(1);
    });
}
