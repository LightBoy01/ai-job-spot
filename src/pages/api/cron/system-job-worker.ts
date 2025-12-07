import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { getFirebaseAdmin, admin } from '@/lib/firebaseAdmin';

const METADATA_COLLECTION = 'metadata';
const COMMON_ROLES_DOC = 'common_roles';
const SYSTEM_JOBS_COLLECTION = 'system_jobs';
const AGGREGATION_INTERVAL_HOURS = 24;

/**
 * This endpoint is called by the Vercel Cron Job scheduler every minute.
 * 
 * Its responsibilities are:
 * 1. To periodically schedule background tasks (like role aggregation).
 * 2. To trigger the system job worker to process any pending jobs in the queue.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log('[Cron API] Handler invoked.');

  try {
    const { adminDb } = await getFirebaseAdmin();

    // --- Scheduling Logic ---
    const metadataRef = adminDb.collection(METADATA_COLLECTION).doc(COMMON_ROLES_DOC);
    const metadataDoc = await metadataRef.get();

    let shouldAggregate = false;
    if (!metadataDoc.exists) {
        console.log('[Cron API] Common roles metadata does not exist. Scheduling aggregation.');
        shouldAggregate = true;
    } else {
        const lastUpdated = metadataDoc.data()?.lastUpdated?.toDate();
        if (lastUpdated) {
            const hoursSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate > AGGREGATION_INTERVAL_HOURS) {
                console.log(`[Cron API] Common roles data is stale (${hoursSinceUpdate.toFixed(1)} hours). Scheduling aggregation.`);
                shouldAggregate = true;
            } else {
                console.log(`[Cron API] Common roles data is fresh (${hoursSinceUpdate.toFixed(1)} hours). Skipping schedule.`);
            }
        } else {
            console.log('[Cron API] lastUpdated field not found. Scheduling aggregation.');
            shouldAggregate = true;
        }
    }
    
    if (shouldAggregate) {
        // Check if a job is already pending to avoid duplicates
        const pendingJobsSnapshot = await adminDb.collection(SYSTEM_JOBS_COLLECTION)
            .where('taskName', '==', 'aggregate-roles')
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (pendingJobsSnapshot.empty) {
            await adminDb.collection(SYSTEM_JOBS_COLLECTION).add({
                taskName: 'aggregate-roles',
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('[Cron API] Successfully scheduled "aggregate-roles" job.');
        } else {
            console.log('[Cron API] "aggregate-roles" job is already pending. Skipping schedule.');
        }
    }

    // --- Worker Trigger Logic ---
    // Always trigger the worker to process the queue.
    console.log('[Cron API] Triggering system job worker script...');
    exec('node scripts/system-job-worker.cts', (error, stdout, stderr) => {
      if (error) {
        console.error(`[Cron API] Error executing worker script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`[Cron API] Worker script STDERR: ${stderr}`);
      }
      console.log(`[Cron API] Worker script STDOUT: ${stdout}`);
    });

    res.status(200).json({ message: 'Cron job handler executed.' });

  } catch (error) {
    console.error('[Cron API] A critical error occurred in the handler:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
