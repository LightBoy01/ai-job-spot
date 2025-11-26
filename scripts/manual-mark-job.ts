import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function markJob() {
  const JOB_ID_TO_MARK = 'job-102';
  console.log(`Attempting to mark job: ${JOB_ID_TO_MARK} as posted to Twitter...`);

  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobRef = adminDb.collection('jobs').doc(JOB_ID_TO_MARK);

    await jobRef.set(
      {
        socialsPosted: {
          twitter: true,
        },
      },
      { merge: true }
    );

    console.log(`✅ Successfully marked ${JOB_ID_TO_MARK} as posted.`);
  } catch (error) {
    console.error(`❌ Failed to mark job ${JOB_ID_TO_MARK}:`, error);
  }
}

markJob();
