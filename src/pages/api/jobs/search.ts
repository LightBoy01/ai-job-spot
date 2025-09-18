import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { JobPosting } from '@/lib/types';
import { Query } from 'firebase-admin/firestore';
import { z } from 'zod';

// Define the schema for query parameter validation
const searchSchema = z.object({
  q: z.string().max(100).optional().default(''), // Search query
  startAfter: z.string().max(100).optional(), // Firestore document ID for pagination
  limit: z.coerce.number().int().positive().max(50).optional().default(10), // Page size
});


// Helper function to convert Firestore Timestamps to ISO strings for serialization
const serializeJob = (doc: FirebaseFirestore.DocumentSnapshot): JobPosting => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        postedDate: data.postedDate.toDate(), // Keep as Date object for now, will be stringified by res.json
        expirationDate: data.expirationDate ? data.expirationDate.toDate() : undefined,
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
    // Validate and parse query parameters
    const validation = searchSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid query parameters.', errors: validation.error.flatten() });
    }
    
    const { q: searchTerm, startAfter: startAfterId, limit } = validation.data;

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    let query: Query = adminDb.collection('jobs').where('status', '==', 'published');

    if (searchTerm) {
      // Simple prefix search on title. For more complex search, a dedicated search service like Algolia is better.
      query = query.where('title', '>=', searchTerm)
                   .where('title', '<=', searchTerm + '\uf8ff');
    }

    // Always order by postedDate descending for consistent pagination
    query = query.orderBy('postedDate', 'desc');

    if (startAfterId) {
      const startAfterDoc = await adminDb.collection('jobs').doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.limit(limit).get();

    const jobs = snapshot.docs.map(serializeJob);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    res.status(200).json({ jobs, lastVisible: lastVisible ? lastVisible.id : null });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
