import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedArticle, FirestoreArticle } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase-admin/firestore'; // Type-only import // eslint-disable-line @typescript-eslint/no-unused-vars

export interface PaginatedArticlesResponse {
  articles: SerializedArticle[];
  lastDocId: string | null;
}

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<PaginatedArticlesResponse | { error: string }>
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

  let query = adminDb.collection('articles').orderBy('publishDate', 'desc');

  if (startAfterDocId) {
    try {
      const startAfterSnapshot = await adminDb.collection('articles').doc(startAfterDocId).get();
      if (startAfterSnapshot.exists) {
        query = query.startAfter(startAfterSnapshot);
      } else {
        // If startAfter document doesn't exist, return empty results
        return res.status(200).json({ articles: [], lastDocId: null });
      }
    } catch (error) {
      console.error('Error fetching startAfter document:', error);
      return res.status(500).json({ error: 'Failed to fetch startAfter document' });
    }
  }

  try {
    console.log(`[articles/paginate] Querying Firestore: limit=${parsedLimit}, startAfterId=${startAfterDocId}`);
    const snapshot = await query.limit(parsedLimit).get();

    if (snapshot.empty) {
      console.log('[articles/paginate] No articles found.');
      return res.status(200).json({ articles: [], lastDocId: null });
    }

    const articles = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreArticle;
        return {
            ...data,
            id: doc.id,
            publishDate: data.publishDate.toDate().toISOString(), // Convert Timestamp to ISO string
        } as SerializedArticle;
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    console.log(`[articles/paginate] Found ${articles.length} articles. Last visible ID: ${lastVisible ? lastVisible.id : 'none'}`);

    return res.status(200).json({
      articles: articles,
      lastDocId: lastVisible ? lastVisible.id : null,
    });
  } catch (error) {
    console.error('[articles/paginate] Error fetching paginated articles:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}