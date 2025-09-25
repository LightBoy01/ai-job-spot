import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Query the 'jobs' collection, but only select the document IDs themselves.
    // This is a highly efficient query as it doesn't retrieve any document data.
    const jobsSnapshot = await adminDb.collection('jobs').select().get();

    if (jobsSnapshot.empty) {
      return res.status(200).json([]);
    }

    const jobIds = jobsSnapshot.docs.map((doc) => doc.id);

    return res.status(200).json(jobIds);
  } catch (error) {
    console.error('Error fetching job IDs:', error);
    // Return a generic server error message
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
