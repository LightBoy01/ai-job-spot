import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedArticle, FirestoreArticle } from '@/lib/types';

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

  try {
    const { adminDb } = await getFirebaseAdmin();
    const { limit, startAfter } = req.query;

    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10;
    const startAfterDocId = typeof startAfter === 'string' ? startAfter : undefined;

    let query = adminDb.collection('articles').orderBy('publishDate', 'desc');

    if (startAfterDocId) {
      const startAfterSnapshot = await adminDb.collection('articles').doc(startAfterDocId).get();
      if (startAfterSnapshot.exists) {
        query = query.startAfter(startAfterSnapshot);
      } else {
        return res.status(200).json({ articles: [], lastDocId: null });
      }
    }

    console.log(`[articles/paginate] Querying Firestore: limit=${parsedLimit}, startAfterId=${startAfterDocId}`);
    const snapshot = await query.limit(parsedLimit).get();

    if (snapshot.empty) {
      console.log('[articles/paginate] No articles found.');
      return res.status(200).json({ articles: [], lastDocId: null });
    }

    const articles = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreArticle;
      return {
        ...data,
        id: doc.id,
        publishDate: data.publishDate.toDate().toISOString(),
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
