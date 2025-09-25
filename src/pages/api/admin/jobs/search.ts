import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { JobPosting } from '@/lib/types';
import { DocumentSnapshot, Query } from 'firebase-admin/firestore';

// Helper function to convert Firestore Timestamp to ISO string
const processJobData = (docSnap: DocumentSnapshot): JobPosting => {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    ...data,
    postedDate: data.postedDate.toDate().toISOString(),
    expirationDate: data.expirationDate
      ? data.expirationDate.toDate().toISOString()
      : null,
  } as JobPosting;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAdmin = await requireAdmin(req as AuthenticatedNextApiRequest, res);
  if (!isAdmin) {
    return; // requireAdmin already sent the response
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, startAfter: startAfterId, limit: limitStr } = req.query;

  const searchTerm = typeof q === 'string' ? q : '';
  const pageLimit = limitStr ? parseInt(limitStr as string, 10) : 10;

  try {
    let query: Query = db.collection('jobs');

    if (searchTerm) {
      query = query
        .where('title', '>=', searchTerm)
        .where('title', '<=', searchTerm + '\uf8ff');
    }

    // ALWAYS apply consistent ordering. Title is first for search, then date.
    query = query.orderBy('title', 'asc').orderBy('postedDate', 'desc');

    if (typeof startAfterId === 'string' && startAfterId) {
      const startAfterDoc = await db.collection('jobs').doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const finalQuery = query.limit(pageLimit);
    const querySnapshot = await finalQuery.get();

    const jobs = querySnapshot.docs.map(processJobData);
    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    res
      .status(200)
      .json({ jobs, lastDocId: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching admin jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
