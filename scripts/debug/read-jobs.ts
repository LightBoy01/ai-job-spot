import { getFirebaseAdmin } from '../../src/lib/firebaseAdmin';

async function readJobs() {
  console.log('Initializing Firebase Admin...');
  const { adminDb: db } = await getFirebaseAdmin();

  console.log('Reading all jobs from the database...');
  const jobsRef = db.collection('jobs');
  const snapshot = await jobsRef.get();

  if (snapshot.empty) {
    console.log('No jobs found in the database.');
    return;
  }

  console.log(`Found ${snapshot.size} jobs:
`);
  snapshot.forEach(doc => {
    console.log(`Job ID: ${doc.id}`);
    console.log(doc.data());
    console.log('---
');
  });
}

readJobs().catch(error => {
  console.error('Error reading jobs:', error);
  process.exit(1);
});
