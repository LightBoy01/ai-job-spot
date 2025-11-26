import { getPendingJobs } from '/data/data/com.termux/files/home/ai-job-spot/src/lib/firestoreClient';

async function runTest() {
  try {
    const pendingJobs = await getPendingJobs();
    console.log(JSON.stringify(pendingJobs, null, 2));
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
  }
}

runTest();
