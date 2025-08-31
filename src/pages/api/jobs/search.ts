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

  const { q, startAfter: startAfterId, limit: limitStr } = req.query;

  const limit = limitStr ? parseInt(limitStr as string, 10) : undefined;

  if (typeof q !== 'string') {
    return res.status(400).json({ message: 'Query must be a string' });
  }

  try {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let startAfterSnapshot = undefined;
    if (typeof startAfterId === 'string' && startAfterId) {
      const docRef = doc(db, 'jobs', startAfterId);
      startAfterSnapshot = await getDoc(docRef);
    }

    console.log('API: Received startAfterId:', startAfterId);
    console.log('API: Search Query:', q);
    const { jobs, lastVisible } = await getJobs(limit, startAfterSnapshot, q);
    console.log('API: Jobs fetched:', jobs.length);
    console.log('API: Last Visible Doc ID returned:', lastVisible ? lastVisible.id : null);
    res.status(200).json({ jobs, lastVisible: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
