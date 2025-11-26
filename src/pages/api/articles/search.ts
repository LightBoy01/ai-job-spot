import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { Article } from '@/lib/types';
import { Query } from 'firebase-admin/firestore';
import { z } from 'zod';

// Define the schema for query parameter validation
const searchSchema = z.object({
  q: z.string().max(100).optional().default(''), // Search query
  startAfter: z.string().max(100).optional(), // Firestore document ID for pagination
  limit: z.coerce.number().int().positive().max(50).optional().default(10), // Page size
  filter: z.enum(['editorial', 'briefing']).optional(), // New filter for content type
});

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

  try {
    const { adminDb } = await getFirebaseAdmin();
    // Validate and parse query parameters
    const validation = searchSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid query parameters.',
        errors: validation.error.flatten(),
      });
    }

    const { q: searchTerm, startAfter: startAfterId, limit, filter } = validation.data;

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    let query: Query = adminDb.collection('articles');

    // Apply filters
    if (filter) {
      query = query.where('contentType', '==', filter);
    }
    if (searchTerm) {
      // Firestore requires the first orderBy to be on the field used in an inequality filter.
      // Since we are now primarily ordering by publishDate, we cannot also use a range filter on title.
      // A more complex search would require a dedicated search service like Algolia or Typesense.
      // For now, we will add a filter on tags which is a common use case.
      query = query.where('tags', 'array-contains', searchTerm.toLowerCase());
    }

    // Apply ordering
    query = query.orderBy('publishDate', 'desc');

    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await adminDb
        .collection('articles')
        .doc(startAfterId)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const articles = snapshot.docs.map(serializeArticle);

    const lastVisibleArticle =
      articles.length > 0
        ? articles[articles.length - 1]
        : null;

    res.status(200).json({
      articles: articles,
      lastVisible: lastVisibleArticle ? lastVisibleArticle.id : null,
    });
  } catch (error) {
    console.error('Error searching for articles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
