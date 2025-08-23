import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedArticle, FirestoreArticle } from '@/lib/types';

export default async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('[articles/search] Received search request.');
    const { q } = req.query;

    if (typeof q !== 'string' || q.trim() === '') {
      console.log('[articles/search] Invalid search query:', q);
      return res.status(400).json({ error: 'Search query must be a non-empty string.' });
    }

    const articlesRef = adminDb.collection('articles');
    const searchTerm = q.trim();
    console.log(`[articles/search] Searching for: "${searchTerm}"`);

    // Firestore does not support case-insensitive text search natively.
    // This query finds titles that start with the search term (case-sensitive).
    // For a more robust search, a third-party service like Algolia or Typesense would be needed.
    const snapshot = await articlesRef
      .where('title', '>=', searchTerm)
      .where('title', '<=', searchTerm + '\uf8ff')
      .limit(15) // Limit results to prevent overly large responses
      .get();

    console.log(`[articles/search] Found ${snapshot.docs.length} documents.`);

    if (snapshot.empty) {
      console.log('[articles/search] No articles found for search term.');
      return res.status(200).json([]);
    }

    const articles = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreArticle; // Cast as FirestoreArticle
        // Ensure publishDate is a valid Date object before calling toISOString()
        const validPublishDate = data.publishDate instanceof Date ? data.publishDate : (data.publishDate && typeof data.publishDate.toDate === 'function' ? data.publishDate.toDate() : new Date());
        const publishDateISO = validPublishDate.toISOString();

        // Construct the SerializedArticle object directly
        return {
            id: doc.id,
            title: data.title,
            author: data.author,
            contentBody: data.contentBody,
            tags: data.tags,
            slug: data.slug,
            issueNo: data.issueNo,
            volumeNo: data.volumeNo,
            imageUrl: data.imageUrl,
            markdownFile: data.markdownFile,
            publishDate: publishDateISO,
        } as SerializedArticle;
    });

    console.log(`[articles/search] Successfully processed ${articles.length} articles.`);
    res.status(200).json(articles);

  } catch (error) {
    console.error('[articles/search] Error searching articles:', error);
    // Log the full error object for more details
    if (error instanceof Error) {
      console.error('[articles/search] Error details:', error.message, error.stack);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
