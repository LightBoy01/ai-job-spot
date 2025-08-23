import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedJobPosting, FirestoreJobPosting } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase-admin/firestore'; // Type-only import // eslint-disable-line @typescript-eslint/no-unused-vars

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
    console.log(`[jobs/paginate] Querying Firestore: limit=${parsedLimit}, startAfterId=${startAfterDocId}`);
    const snapshot = await query.limit(parsedLimit).get();

    if (snapshot.empty) {
      console.log('[jobs/paginate] No jobs found.');
      return res.status(200).json({ jobs: [], lastDocId: null });
    }

    const jobs = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreJobPosting;
        return {
            ...data,
            id: doc.id,
            postedDate: data.postedDate.toDate().toISOString(), // Convert Timestamp to ISO string
            expirationDate: data.expirationDate ? data.expirationDate.toDate().toISOString() : null, // Convert Timestamp to ISO string
        } as SerializedJobPosting;
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    console.log(`[jobs/paginate] Found ${jobs.length} jobs. Last visible ID: ${lastVisible ? lastVisible.id : 'none'}`);

    return res.status(200).json({
      jobs: jobs,
      lastDocId: lastVisible ? lastVisible.id : null,
    });
  } catch (error) {
    console.error('[jobs/paginate] Error fetching paginated jobs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}