import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedJobPosting, FirestoreJobPosting } from '@/lib/types';

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

  try {
    const { adminDb } = await getFirebaseAdmin();
    const { limit, startAfter } = req.query;

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10;
    const startAfterDocId = typeof startAfter === 'string' ? startAfter : undefined;

    let query = adminDb.collection('jobs').orderBy('postedDate', 'desc');

    if (startAfterDocId) {
      const startAfterSnapshot = await adminDb.collection('jobs').doc(startAfterDocId).get();
      if (startAfterSnapshot.exists) {
        query = query.startAfter(startAfterSnapshot);
      } else {
        return res.status(200).json({ jobs: [], lastDocId: null });
      }
    }

    console.log(`[jobs/paginate] Querying Firestore: limit=${parsedLimit}, startAfterId=${startAfterDocId}`);
    const snapshot = await query.limit(parsedLimit).get();

    if (snapshot.empty) {
      console.log('[jobs/paginate] No jobs found.');
      return res.status(200).json({ jobs: [], lastDocId: null });
    }

    const jobs = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreJobPosting;
      return {
        ...data,
        id: doc.id,
        postedDate: data.postedDate.toDate().toISOString(),
        expirationDate: data.expirationDate ? data.expirationDate.toDate().toISOString() : null,
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
