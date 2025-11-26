import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function reportJobStatus() {
  console.log('Generating job posting status report...');

  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobsRef = adminDb.collection('jobs');
    const snapshot = await jobsRef.get();

    if (snapshot.empty) {
      console.log('No jobs found in the database.');
      return;
    }

    const postedJobs: any[] = [];
    const pendingJobs: any[] = [];

    snapshot.forEach(doc => {
      const jobData = doc.data();
      const jobId = doc.id;
      const jobTitle = jobData.title || '[No Title]';

      if (jobData.socialsPosted?.twitter) {
        postedJobs.push({ id: jobId, title: jobTitle });
      } else {
        pendingJobs.push({ id: jobId, title: jobTitle });
      }
    });

    console.log('\n--- Job Posting Status Report ---');
    console.log('\nPosted Jobs:');
    if (postedJobs.length > 0) {
      postedJobs.forEach(job => console.log(`- ID: ${job.id}, Title: ${job.title}`));
    } else {
      console.log('  (None)');
    }

    console.log('\nPending Jobs (Remaining to be Posted):');
    if (pendingJobs.length > 0) {
      pendingJobs.forEach(job => console.log(`- ID: ${job.id}, Title: ${job.title}`));
    } else {
      console.log('  (None)');
    }
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Failed to generate job status report:', error);
  }
}

reportJobStatus();
