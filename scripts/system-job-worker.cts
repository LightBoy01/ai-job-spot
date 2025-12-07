const { getFirebaseAdmin, admin } = require('../src/lib/firebaseAdmin');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const SYSTEM_JOBS_COLLECTION = 'system_jobs';

/**
 * Executes a single pending system job from the Firestore queue.
 */
async function processSystemJob() {
  console.log('System Job Worker: Checking for pending jobs...');
  const { adminDb } = await getFirebaseAdmin();
  const jobsRef = adminDb.collection(SYSTEM_JOBS_COLLECTION);

  // Find a pending job
  const pendingJobsSnapshot = await jobsRef
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .limit(1)
    .get();

  if (pendingJobsSnapshot.empty) {
    console.log('System Job Worker: No pending jobs found.');
    return;
  }

  const jobDoc = pendingJobsSnapshot.docs[0];
  const jobId = jobDoc.id;
  const jobData = jobDoc.data();
  const jobRef = jobDoc.ref;

  console.log(`System Job Worker: Found job [${jobId}], task [${jobData.taskName}]. Locking...`);

  try {
    // Lock the job to prevent other workers from picking it up
    await jobRef.update({
      status: 'running',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`System Job Worker: Executing [${jobData.taskName}]...`);

    const command = `node scripts/ops.cts --run=${jobData.taskName}`;
    const { stdout, stderr } = await execPromise(command);

    console.log(`System Job Worker: [${jobData.taskName}] finished.`);

    // Job succeeded
    await jobRef.update({
      status: 'completed',
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      stdout: stdout || '',
      stderr: stderr || '',
    });
    console.log(`System Job Worker: Job [${jobId}] completed successfully.`);

  } catch (error) {
    console.error(`System Job Worker: Job [${jobId}] failed.`);
    console.error(error);
    
    // Job failed
    await jobRef.update({
      status: 'failed',
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error.message || 'Unknown error',
      stdout: error.stdout || '',
      stderr: error.stderr || '',
    });
  }
}

if (require.main === module) {
    processSystemJob()
    .then(() => {
        console.log('System Job Worker: Run finished.');
        process.exit(0);
    })
    .catch(err => {
        console.error('System Job Worker: Unhandled error in main execution.', err);
        process.exit(1);
    });
}