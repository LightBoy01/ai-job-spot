const { getFirebaseAdmin } = require('../../src/lib/firebaseAdmin.cts');

async function getJob(jobId: string) {
  const { adminDb } = await getFirebaseAdmin();

  if (!jobId) {
    console.error('Error: Please provide a job ID as an argument.');
    process.exit(1);
  }

  console.log(`Fetching job with ID: ${jobId}...`);

  try {
    const jobDocRef = adminDb.collection('jobs').doc(jobId);
    const jobDocSnap = await jobDocRef.get();

    if (!jobDocSnap.exists) {
      console.log(`No document found with ID: ${jobId}`);
      return;
    }

    const jobData = jobDocSnap.data();
    console.log('Found document:');
    console.log(JSON.stringify(jobData, null, 2));
  } catch (error) {
    console.error('Error fetching document:', error);
  }
}

const jobId = process.argv[2];
getJob(jobId);
