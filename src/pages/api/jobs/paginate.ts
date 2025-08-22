import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { JobPosting, SerializedJobPosting } from '@/lib/types';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export interface PaginatedJobsResponse {
  jobs: SerializedJobPosting[];
  lastDocId: string | null;
}

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<PaginatedJobsResponse | { error: string }>
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { limit, startAfter } = req.query;

  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10; // Default limit
  const startAfterDocId = typeof startAfter === 'string' ? startAfter : undefined;

  let query = adminDb.collection('jobs').orderBy('postedDate', 'desc');

  if (startAfterDocId) {
    try {
      const startAfterSnapshot = await adminDb.collection('jobs').doc(startAfterDocId).get();
      if (startAfterSnapshot.exists) {
        query = query.startAfter(startAfterSnapshot);
      } else {
        // If startAfter document doesn't exist, return empty results
        return res.status(200).json({ jobs: [], lastDocId: null });
      }
    } catch (error) {
      console.error('Error fetching startAfter document:', error);
      return res.status(500).json({ error: 'Failed to fetch startAfter document' });
    }
  }

  try {
    const snapshot = await query.limit(parsedLimit).get();

    if (snapshot.empty) {
      return res.status(200).json({ jobs: [], lastDocId: null });
    }

    const jobs = snapshot.docs.map(doc => {
        const data = doc.data() as JobPosting;
        return {
            ...data,
            id: doc.id,
            postedDate: data.postedDate.toISOString(), // Ensure it's an ISO string
            expirationDate: data.expirationDate ? data.expirationDate.toISOString() : null, // Ensure it's an ISO string
        } as SerializedJobPosting;
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return res.status(200).json({
      jobs: jobs,
      lastDocId: lastVisible ? lastVisible.id : null,
    });
  } catch (error) {
    console.error('Error fetching paginated jobs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}