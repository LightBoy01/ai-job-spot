import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Define a Zod schema for the status update
const JobStatusSchema = z.object({
  status: z.enum(['published', 'rejected'], { message: 'Invalid status provided.' }),
});

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  // Validate the request body using Zod
  const validationResult = JobStatusSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      message: 'Validation failed',
      details: validationResult.error.flatten().fieldErrors,
    });
  }

  const { status } = validationResult.data;

  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobRef = adminDb.collection('jobs').doc(id);
    const updateData: {
      status: string;
      postedDate?: FirebaseFirestore.FieldValue;
    } = { status };

    if (status === 'published') {
      updateData.postedDate = admin.firestore.FieldValue.serverTimestamp();
    }

    await jobRef.update(updateData);

    // Revalidate pages to reflect the change
    await res.revalidate('/');
    await res.revalidate(`/jobs/${id}`);

    res.status(200).json({ message: `Job ${status} successfully.` });
  } catch (error) {
    console.error(`Error updating job ${id} to ${status}:`, error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
}
