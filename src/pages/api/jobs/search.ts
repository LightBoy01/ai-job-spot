import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobs } from '@/lib/firestoreClient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q, startAfter: startAfterId } = req.query;

  if (typeof q !== 'string') {
    return res.status(400).json({ message: 'Query must be a string' });
  }

  try {
    let startAfterSnapshot = undefined;
    if (typeof startAfterId === 'string') {
      const docRef = doc(db, 'jobs', startAfterId);
      startAfterSnapshot = await getDoc(docRef);
    }

    const { jobs, lastVisible } = await getJobs(undefined, startAfterSnapshot, q);
    res.status(200).json({ jobs, lastVisible: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
