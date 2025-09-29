import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { JobPosting } from '@/lib/types';
import { Query } from 'firebase-admin/firestore';
import { z } from 'zod';

// Define the schema for query parameter validation
const searchSchema = z.object({
  q: z.string().max(100).optional().default(''), // Search query
  startAfter: z.string().max(100).optional(), // Firestore document ID for pagination
  limit: z.coerce.number().int().positive().max(50).optional().default(10), // Page size
  location: z.string().max(100).optional(),
  jobLevel: z.string().max(50).optional(),
  tags: z.string().max(200).optional(), // Comma-separated tags
});

// Helper function to convert Firestore Timestamps to ISO strings for serialization
const serializeJob = (doc: FirebaseFirestore.DocumentSnapshot): JobPosting => {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    postedDate: data.postedDate.toDate(), // Keep as Date object for now, will be stringified by res.json
    expirationDate: data.expirationDate
      ? data.expirationDate.toDate()
      : undefined,
  } as JobPosting;
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

    const {
      q: searchTerm,
      startAfter: startAfterId,
      limit,
      location,
      jobLevel,
      tags,
    } = validation.data;

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    // This is a simplified query builder. A real-world, complex search might use
    // a dedicated search service like Algolia or Typesense for better performance
    // and more advanced features than Firestore can provide alone.
    let query: Query = adminDb.collection('jobs').where('status', '==', 'published');

    // Apply exact match filters first
    if (location) {
      // This is a simplification. A real app might need more flexible location search.
      query = query.where('location', '==', location);
    }
    if (jobLevel) {
      query = query.where('jobLevel', '==', jobLevel);
    }
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(t => t);
      if (tagsArray.length > 0) {
        // Firestore limitation: You can only have one 'array-contains-any' clause per query.
        query = query.where('tags', 'array-contains-any', tagsArray);
      }
    }

    // The general search term 'q' is harder to implement efficiently with Firestore
    // due to its query limitations. A common strategy is to create a 'keywords'
    // array field in each document containing relevant terms (title, company, etc.)
    // in lowercase, and then use an 'array-contains' query.
    if (searchTerm) {
        const keywords = searchTerm.toLowerCase().split(' ').filter(k => k);
        if (keywords.length > 0) {
            // This assumes a 'keywords' field exists in your documents.
            // You would need to populate this field when creating/updating jobs.
            query = query.where('keywords', 'array-contains-any', keywords);
        }
    }

    // Always order by date as the final sort criterion
    query = query.orderBy('postedDate', 'desc');

    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await adminDb.collection('jobs').doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const jobs = snapshot.docs.map(serializeJob);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    res.status(200).json({
      jobs: jobs,
      lastVisible: lastVisible ? lastVisible.id : null,
    });

  } catch (error) {
    console.error('Error searching for jobs:', error);
    // Firestore throws specific errors for invalid queries, which can be caught here
    if (error instanceof Error && error.message.includes('invalid')) {
        return res.status(400).json({ message: `Invalid query: ${error.message}` });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
