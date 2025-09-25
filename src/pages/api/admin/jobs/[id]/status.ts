import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import * as admin from 'firebase-admin';

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
  const { status } = req.body;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  if (!['published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
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
