import type { NextApiRequest, NextApiResponse } from 'next';

import {
  DocumentSnapshot,
  Query,
  Timestamp,
} from 'firebase-admin/firestore';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { AuthenticatedNextApiRequest, requireAdmin } from '@/lib/middleware';

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

// Helper function to convert Firestore Timestamp to ISO string
const processJobData = (docSnap: DocumentSnapshot) => {
  const data = docSnap.data();
  if (!data) {
    throw new Error(`Document data is empty for doc: ${docSnap.id}`);
  }

  const postedDate = isTimestamp(data.postedDate)
    ? data.postedDate.toDate().toISOString()
    : new Date().toISOString();

  const expirationDate =
    data.expirationDate && isTimestamp(data.expirationDate)
      ? data.expirationDate.toDate().toISOString()
      : null;

  return {
    ...data,
    expirationDate,
    id: docSnap.id,
    postedDate,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAdmin = await requireAdmin(req as AuthenticatedNextApiRequest, res);
  if (!isAdmin) {
    return; // requireAdmin already sent the response
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit: limitStr, q, startAfter: startAfterId } = req.query;

  const searchTerm = typeof q === 'string' ? q : '';
  const pageLimit = limitStr ? parseInt(limitStr as string, 10) : 10;

  try {
    const { adminDb: db } = await getFirebaseAdmin();
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
  } catch (error: unknown) {
    console.error('Error searching admin jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;