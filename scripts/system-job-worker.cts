const { getFirebaseAdmin } = require('../src/lib/firebaseAdmin.cts');
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Maps a safe, predefined task name to the actual shell command to be executed.
 * This is a critical security measure to prevent command injection.
 */
function getCommandForTask(taskName: string, isDryRun: boolean): string | null {
  const commandMap: Record<string, string> = {
    ENRICH_JOBS: 'ts-node scripts/ops.ts --run=enrich --type=jobs',
    ENRICH_BRIEFINGS: 'ts-node scripts/ops.ts --run=enrich --type=briefings',
    RUN_HYGIENE: 'ts-node scripts/ops.ts --run=hygiene',
    RUN_SEED: 'ts-node scripts/ops.ts --run=seed',
  };
  
  const command = commandMap[taskName];
  if (!command) return null;

  return isDryRun ? `${command} --dry-run` : command;
}

async function runSystemJob() {
  console.log('[Worker] Starting system job worker...');
  const { adminDb } = await getFirebaseAdmin();
  const jobsCollection = adminDb.collection('system_jobs');

  // 1. Find a pending job
  const pendingJobsSnapshot = await jobsCollection
    .where('status', '==', 'pending')
    .orderBy('createdAt')
    .limit(1)
    .get();

  if (pendingJobsSnapshot.empty) {
    console.log("[Worker] No pending jobs found. Exiting.");
    return;
  }

  const jobDoc = pendingJobsSnapshot.docs[0];
  const jobData = jobDoc.data();
  const { jobId, taskName, isDryRun = false } = jobData;

  console.log(`[Worker] Found pending job: ${jobId} (${taskName}) - Dry Run: ${isDryRun}`);

  try {
    // 2. Lock the job by updating its status to 'running'
    await jobDoc.ref.update({
      status: 'running',
      updatedAt: new Date(),
      outputLogs: `[${new Date().toISOString()}] Worker picked up job. Starting execution... (Dry Run: ${isDryRun})`
    });

    // 3. Get the command and execute it
    const command = getCommandForTask(taskName, isDryRun);
    if (!command) {
      throw new Error(`No command found for task: ${taskName}`);
    }

    console.log(`[Worker] Executing command: ${command}`);
    const { stdout, stderr } = await execAsync(command);

    const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`.trim();
    console.log(`[Worker] Command executed for job ${jobId}. Output captured.`);

    // 4. Update job to 'completed' on success
    await jobDoc.ref.update({
      status: 'completed',
      updatedAt: new Date(),
      completedAt: new Date(),
      outputLogs: `[${new Date().toISOString()}] Job completed successfully. (Dry Run: ${isDryRun})\n\n${output}`
    });

    console.log(`[Worker] Job ${jobId} marked as completed.`);

  } catch (error: any) {
    console.error(`[Worker] Error processing job ${jobId}:`, error);
    const errorMessage = error.message || 'An unknown error occurred';
    const errorOutput = error.stdout || '';
    const errorStderr = error.stderr || '';

    // 5. Update job to 'failed' on error
    await jobDoc.ref.update({
      status: 'failed',
      updatedAt: new Date(),
      completedAt: new Date(),
      outputLogs: `[${new Date().toISOString()}] Job failed. (Dry Run: ${isDryRun})\n\nERROR: ${errorMessage}\n\nSTDOUT:\n${errorOutput}\n\nSTDERR:\n${errorStderr}`
    });
    console.log(`[Worker] Job ${jobId} marked as failed.`);
  }
}

// --- EXECUTION BLOCK ---
runSystemJob()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("A critical, unhandled error occurred in the system job worker:", error);
    process.exit(1);
  });
