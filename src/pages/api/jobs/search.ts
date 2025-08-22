import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { JobPosting, SerializedJobPosting } from '@/lib/types';

export default async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { q } = req.query;

    if (typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ error: 'Search query must be a non-empty string.' });
    }

    const jobsRef = adminDb.collection('jobs');
    const searchTerm = q.trim();

    const snapshot = await jobsRef
      .where('title', '>=', searchTerm)
      .where('title', '<=', searchTerm + '\uf8ff')
      .limit(15)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const jobs = snapshot.docs.map(doc => {
        const data = doc.data() as JobPosting;
        const { postedDate, expirationDate, ...rest } = data;
        return {
            ...rest,
            id: doc.id,
            postedDate: new Date(postedDate).toISOString(),
            expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
        } as SerializedJobPosting;
    });

    res.status(200).json(jobs);

  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
