import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

// This endpoint is called by the Vercel Cron Job scheduler.
// Its only purpose is to execute our system job worker script.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log('[Cron API] Received request to run system job worker.');

  // Execute the worker script. We don't wait for it to finish.
  // The worker itself handles its lifecycle and logging in Firestore.
  exec('ts-node scripts/system-job-worker.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`[Cron API] Error executing worker script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.warn(`[Cron API] Worker script STDERR: ${stderr}`);
    }
    console.log(`[Cron API] Worker script STDOUT: ${stdout}`);
  });

  // Respond immediately to the scheduler.
  res.status(200).json({ message: 'System job worker execution triggered.' });
}
