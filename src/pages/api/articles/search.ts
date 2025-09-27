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

    const { q: searchTerm, startAfter: startAfterId, limit } = validation.data;
    const lowerSearchTerm = searchTerm.toLowerCase();

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    const articles: Article[] = [];
    const fetchedDocIds = new Set<string>();

    // Function to fetch and process a query result
    const fetchAndProcess = async (baseQuery: Query) => {
      let currentQuery = baseQuery;
      if (startAfterId) {
        const startAfterDoc = await adminDb
          .collection('articles')
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) {
          currentQuery = currentQuery.startAfter(startAfterDoc);
        }
      }
      const snapshot = await currentQuery.limit(limit).get();
      snapshot.docs.forEach((doc) => {
        if (!fetchedDocIds.has(doc.id)) {
          articles.push(serializeArticle(doc));
          fetchedDocIds.add(doc.id);
        }
      });
    };

    // --- Multi-field Search Queries ---
    if (searchTerm) {
      // 1. Search by Title (prefix match)
      await fetchAndProcess(
        adminDb
          .collection('articles')
          .where('title', '>=', searchTerm)
          .where('title', '<=', searchTerm + '\uf8ff')
          .orderBy('title')
          .orderBy('publishDate', 'desc')
      );

      // 2. Search by Author (prefix match)
      await fetchAndProcess(
        adminDb
          .collection('articles')
          .where('author', '>=', searchTerm)
          .where('author', '<=', searchTerm + '\uf8ff')
          .orderBy('author')
          .orderBy('publishDate', 'desc')
      );

      // 3. Search by Tags (array-contains-any)
      await fetchAndProcess(
        adminDb
          .collection('articles')
          .where('tags', 'array-contains-any', [searchTerm])
          .orderBy('publishDate', 'desc')
      );
    } else {
      // If no search term, return all published articles, paginated
      await fetchAndProcess(
        adminDb.collection('articles').orderBy('publishDate', 'desc')
      );
    }

    // --- Simple Relevance Scoring and Deduplication ---
    articles.sort((a, b) => {
      // Prioritize exact title matches
      const aTitleMatch = a.title.toLowerCase().includes(lowerSearchTerm);
      const bTitleMatch = b.title.toLowerCase().includes(lowerSearchTerm);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Then by publish date
      return (b.publishDate?.getTime() || 0) - (a.publishDate?.getTime() || 0);
    });

    // Manual pagination after merging and sorting
    const paginatedArticles = articles.slice(0, limit);
    const lastVisibleArticle =
      paginatedArticles.length > 0
        ? paginatedArticles[paginatedArticles.length - 1]
        : null;

    res.status(200).json({
      articles: paginatedArticles,
      lastVisible: lastVisibleArticle ? lastVisibleArticle.id : null,
    });
  } catch (error) {
    console.error('Error searching for articles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
