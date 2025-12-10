import type { NextApiRequest, NextApiResponse } from 'next';

import { Query, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Define the schema for query parameter validation
const searchSchema = z.object({
  filter: z.enum(['editorial', 'briefing']).optional(), // New filter for content type
  hub: z.string().optional(), // Filter by thematic hub
  limit: z.coerce.number().int().positive().max(50).optional().default(10), // Page size
  q: z.string().max(100).optional().default(''), // Search query
  startAfter: z.string().max(100).optional(), // Firestore document ID for pagination
});

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

// Helper function to convert Firestore Timestamps to ISO strings for serialization
const serializeArticle = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is empty.');
  }
  return {
    id: doc.id,
    ...data,
    publishDate: isTimestamp(data.publishDate)
      ? data.publishDate.toDate().toISOString()
      : new Date().toISOString(),
  };
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
        errors: validation.error.flatten(),
        message: 'Invalid query parameters.',
      });
    }

    const {
      filter,
      hub,
      limit,
      q: searchTerm,
      startAfter: startAfterId,
    } = validation.data;

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    let query: Query = adminDb.collection('articles');

    // Apply filters
    if (filter) {
      query = query.where('contentType', '==', filter);
    }
    if (hub) {
      // Hubs are stored in lowercase in the database
      query = query.where('hub', '==', hub.toLowerCase());
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
      articles.length > 0 ? articles[articles.length - 1] : null;

    res.status(200).json({
      articles: articles,
      lastVisible: lastVisibleArticle ? lastVisibleArticle.id : null,
    });
  } catch (error) {
    console.error('Error searching for articles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
