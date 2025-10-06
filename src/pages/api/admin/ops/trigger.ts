import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { z } from 'zod';

// Define the list of allowed tasks to prevent arbitrary execution
const AllowedTasks = z.enum(['ENRICH_JOBS', 'ENRICH_BRIEFINGS', 'RUN_HYGIENE', 'RUN_SEED']);

const RequestBodySchema = z.object({
  taskName: AllowedTasks,
  isDryRun: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { adminDb, adminAuth } = await getFirebaseAdmin();

    // 1. Authenticate the user using the session cookie
    const sessionCookie = req.cookies.__session || '';
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedToken.admin) {
      return res.status(403).json({ message: 'Forbidden: User is not an admin.' });
    }

    // 2. Validate the request body
    const validationResult = RequestBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Invalid request body.', issues: validationResult.error.issues });
    }

    const { taskName, isDryRun = false } = validationResult.data;

    // 3. Create the job document in Firestore
    const jobsCollection = adminDb.collection('system_jobs');
    const newJobRef = jobsCollection.doc(); // Auto-generate a new document ID

    const newJob = {
      jobId: newJobRef.id,
      taskName: taskName,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDryRun: isDryRun,
      outputLogs: `Job "${taskName}" scheduled at ${new Date().toISOString()} (Dry Run: ${isDryRun})`,
    };

    await newJobRef.set(newJob);

    // 4. Respond immediately
    res.status(202).json({ message: 'Job scheduled successfully', jobId: newJob.jobId });

  } catch (error) {
    console.error('Error scheduling job:', error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/session-cookie-expired') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
