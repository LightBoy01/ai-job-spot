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

    let jobs: JobPosting[] = [];
    const fetchedDocIds = new Set<string>();

    // Function to fetch and process a query result
    const fetchAndProcess = async (baseQuery: Query) => {
      let currentQuery = baseQuery;
      if (startAfterId) {
        const startAfterDoc = await adminDb.collection('jobs').doc(startAfterId).get();
        if (startAfterDoc.exists) {
          currentQuery = currentQuery.startAfter(startAfterDoc);
        }
      }
      const snapshot = await currentQuery.limit(limit).get();
      snapshot.docs.forEach(doc => {
        if (!fetchedDocIds.has(doc.id)) {
          jobs.push(serializeJob(doc));
          fetchedDocIds.add(doc.id);
        }
      });
    };

    // --- Multi-field Search Queries ---
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();

      // 1. Search by Title (prefix match)
      await fetchAndProcess(
        adminDb.collection('jobs')
          .where('status', '==', 'published')
          .where('title', '>=', searchTerm)
          .where('title', '<=', searchTerm + '\uf8ff')
          .orderBy('title')
          .orderBy('postedDate', 'desc')
      );

      // 2. Search by Company (prefix match)
      await fetchAndProcess(
        adminDb.collection('jobs')
          .where('status', '==', 'published')
          .where('company', '>=', searchTerm)
          .where('company', '<=', searchTerm + '\uf8ff')
          .orderBy('company')
          .orderBy('postedDate', 'desc')
      );

      // 3. Search by Location (prefix match)
      await fetchAndProcess(
        adminDb.collection('jobs')
          .where('status', '==', 'published')
          .where('location', '>=', searchTerm)
          .where('location', '<=', searchTerm + '\uf8ff')
          .orderBy('location')
          .orderBy('postedDate', 'desc')
      );

      // 4. Search by Tags (array-contains-any)
      // Note: array-contains-any cannot be combined with range filters on other fields.
      // We fetch separately and merge.
      await fetchAndProcess(
        adminDb.collection('jobs')
          .where('status', '==', 'published')
          .where('tags', 'array-contains-any', [searchTerm])
          .orderBy('postedDate', 'desc')
      );

      // 5. Search by Description (basic keyword check - requires keywords to be stored as array)
      // This is a placeholder. Full-text search on description requires a dedicated search solution.
      // If description keywords are stored as an array, you could use array-contains-any here.
      // For now, we'll rely on other fields.

    } else {
      // If no search term, return all published jobs, paginated
      await fetchAndProcess(
        adminDb.collection('jobs')
          .where('status', '==', 'published')
          .orderBy('postedDate', 'desc')
      );
    }

    // --- Simple Relevance Scoring and Deduplication ---
    // Sort by relevance (e.g., title match > company/location/tag match)
    // For simplicity, we've already deduplicated during fetchAndProcess.
    // A more advanced scoring would involve assigning points and re-sorting.
    jobs.sort((a, b) => {
      // Prioritize exact title matches
      const aTitleMatch = a.title.toLowerCase().includes(lowerSearchTerm);
      const bTitleMatch = b.title.toLowerCase().includes(lowerSearchTerm);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Then by posted date
      return b.postedDate.getTime() - a.postedDate.getTime();
    });

    // Manual pagination after merging and sorting
    const paginatedJobs = jobs.slice(0, limit);
    const lastVisibleJob = paginatedJobs.length > 0 ? paginatedJobs[paginatedJobs.length - 1] : null;

    res.status(200).json({ jobs: paginatedJobs, lastVisible: lastVisibleJob ? lastVisibleJob.id : null });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
