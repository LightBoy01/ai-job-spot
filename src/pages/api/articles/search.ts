import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Article, SerializedArticle } from '@/lib/types';

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

    const articlesRef = adminDb.collection('articles');
    const searchTerm = q.trim();

    // Firestore does not support case-insensitive text search natively.
    // This query finds titles that start with the search term (case-sensitive).
    // For a more robust search, a third-party service like Algolia or Typesense would be needed.
    const snapshot = await articlesRef
      .where('title', '>=', searchTerm)
      .where('title', '<=', searchTerm + '\uf8ff')
      .limit(15) // Limit results to prevent overly large responses
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const articles = snapshot.docs.map(doc => {
        const data = doc.data() as Article;
        const { publishDate, ...rest } = data;
        return {
            ...rest,
            id: doc.id,
            publishDate: new Date(publishDate).toISOString(),
        } as SerializedArticle;
    });

    res.status(200).json(articles);

  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
