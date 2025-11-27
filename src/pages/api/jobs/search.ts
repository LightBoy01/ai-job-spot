import type { NextApiRequest, NextApiResponse } from 'next';

import { Query, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { isErrorWithMessage } from '@/lib/utils';

// Define the schema for query parameter validation
const searchSchema = z.object({
  jobLevel: z.string().max(50).optional(),
  limit: z.coerce.number().int().positive().max(50).optional().default(10), // Page size
  location: z.string().max(100).optional(),
  q: z.string().max(100).optional().default(''), // Search query
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'), // Sort order for postedDate
  startAfter: z.string().max(100).optional(), // Firestore document ID for pagination
  tags: z.string().max(200).optional(), // Comma-separated tags
});

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

// Helper function to convert Firestore Timestamps to ISO strings for serialization
const serializeJob = (doc: FirebaseFirestore.DocumentSnapshot) => {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is empty');
  }
  return {
    id: doc.id,
    ...data,
    expirationDate:
      data.expirationDate && isTimestamp(data.expirationDate)
        ? data.expirationDate.toDate().toISOString()
        : null,
    postedDate: isTimestamp(data.postedDate)
      ? data.postedDate.toDate().toISOString()
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
      jobLevel,
      limit,
      location,
      q: searchTerm,
      sortOrder,
      startAfter: startAfterId,
      tags,
    } = validation.data;

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    // This is a simplified query builder. A real-world, complex search might use
    // a dedicated search service like Algolia or Typesense for better performance
    // and more advanced features than Firestore can provide alone.
    let query: Query = adminDb
      .collection('jobs')
      .where('status', '==', 'published');

    // Apply exact match filters first
    if (location) {
      query = query.where('location', '==', location);
    }
    if (jobLevel) {
      query = query.where('jobLevel', '==', jobLevel);
    }
    if (tags) {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((t) => t);
      if (tagsArray.length > 0) {
        query = query.where('tags', 'array-contains-any', tagsArray);
      }
    }

    if (searchTerm) {
      const keywords = searchTerm
        .toLowerCase()
        .split(' ')
        .filter((k) => k);
      if (keywords.length > 0) {
        query = query.where('keywords', 'array-contains-any', keywords);
      }
    }

    // Always order by completenessScore as the primary sort criterion, then by postedDate
    query = query
      .orderBy('completenessScore', 'desc')
      .orderBy('postedDate', sortOrder);

    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await adminDb
        .collection('jobs')
        .doc(startAfterId)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const jobs = snapshot.docs.map(serializeJob);
    const lastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    res.status(200).json({
      jobs: jobs,
      lastVisible: lastVisible ? lastVisible.id : null,
    });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    // Firestore throws specific errors for invalid queries, which can be caught here
    if (isErrorWithMessage(error) && error.message.includes('invalid')) {
      return res
        .status(400)
        .json({ message: `Invalid query: ${error.message}` });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
