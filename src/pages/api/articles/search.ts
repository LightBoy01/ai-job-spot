import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Article } from '@/lib/types';
import { Query } from 'firebase-admin/firestore';

// Helper function to convert Firestore Timestamps to ISO strings for serialization
const serializeArticle = (doc: FirebaseFirestore.DocumentSnapshot): Article => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        publishDate: data.publishDate.toDate(), // Keep as Date object, will be stringified by res.json
    } as Article;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q, startAfter: startAfterId, limit: limitStr } = req.query;

  const limit = limitStr ? parseInt(limitStr as string, 10) : 10; // Default to 10
  const searchTerm = typeof q === 'string' ? q.trim() : '';

  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    let query: Query = adminDb.collection('articles');

    if (searchTerm) {
      query = query.where('title', '>=', searchTerm)
                   .where('title', '<=', searchTerm + '\uf8ff');
    }

    query = query.orderBy('publishDate', 'desc');

    if (typeof startAfterId === 'string' && startAfterId) {
      const startAfterDoc = await adminDb.collection('articles').doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.limit(limit).get();

    const articles = snapshot.docs.map(serializeArticle);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    res.status(200).json({ articles, lastVisible: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching for articles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}