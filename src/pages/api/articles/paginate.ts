import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { getArticles } from '@/lib/firestoreClient';
import { SerializedArticle } from '@/lib/types';
import { DocumentSnapshot, doc, getDoc } from 'firebase/firestore'; // Import doc and getDoc

export interface PaginatedArticlesResponse {
  articles: SerializedArticle[];
  lastDocId: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedArticlesResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { limit, startAfter } = req.query;

  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : undefined;
  const startAfterDocId = typeof startAfter === 'string' ? startAfter : undefined;

  let startAfterDoc: DocumentSnapshot | undefined = undefined;

  if (startAfterDocId) {
    try {
      // Fetch the actual DocumentSnapshot using the client-side db
      const docRef = doc(db, 'articles', startAfterDocId); // Correct usage of doc
      const docSnap = await getDoc(docRef); // Use getDoc function
      if (docSnap.exists()) {
        startAfterDoc = docSnap;
      } else {
        return res.status(200).json({ articles: [], lastDocId: null });
      }
    } catch (error) {
      console.error('Error fetching startAfter document:', error);
      return res.status(500).json({ error: 'Failed to fetch startAfter document' });
    }
  }

  try {
    const { articles, lastVisible } = await getArticles(parsedLimit, startAfterDoc);

    return res.status(200).json({
      articles: articles.map(article => ({
        ...article,
        publishDate: article.publishDate.toISOString(), // Ensure serialization
      })),
      lastDocId: lastVisible ? lastVisible.id : null,
    });
  } catch (error) {
    console.error('Error fetching paginated articles:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}