import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Article } from '@/lib/types';
import { DocumentSnapshot, Query } from 'firebase-admin/firestore';

// Helper function to convert Firestore Timestamp to ISO string
const processArticleData = (docSnap: DocumentSnapshot): Article => {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    ...data,
    publishDate: data.publishDate.toDate().toISOString(),
  } as Article;
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
    let query: Query = db.collection('articles');

    if (searchTerm) {
      query = query
        .where('title', '>=', searchTerm)
        .where('title', '<=', searchTerm + '\uf8ff')
        .orderBy('title', 'asc')
        .orderBy('publishDate', 'desc');
    } else {
      query = query.orderBy('publishDate', 'desc');
    }

    if (typeof startAfterId === 'string' && startAfterId) {
      const startAfterDoc = await db
        .collection('articles')
        .doc(startAfterId)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const finalQuery = query.limit(pageLimit);
    const querySnapshot = await finalQuery.get();

    const articles = querySnapshot.docs.map(processArticleData);
    const lastVisible =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    res
      .status(200)
      .json({ articles, lastDocId: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching admin articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;
