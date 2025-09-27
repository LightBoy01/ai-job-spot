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
  fetchAll: z.coerce.boolean().optional().default(false), // Bypass pagination
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
      fetchAll,
    } = validation.data;
    const lowerSearchTerm = searchTerm.toLowerCase();

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    const jobs: JobPosting[] = [];
    const fetchedDocIds = new Set<string>();

    // Function to fetch and process a query result
    const fetchAndProcess = async (baseQuery: Query) => {
      let currentQuery = baseQuery;
      // Conditionally apply pagination
      if (!fetchAll && startAfterId) {
        const startAfterDoc = await adminDb
          .collection('jobs')
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) {
          currentQuery = currentQuery.startAfter(startAfterDoc);
        }
      }
      
      // Conditionally apply limit
      if (!fetchAll) {
        currentQuery = currentQuery.limit(limit);
      }

      const snapshot = await currentQuery.get();
      snapshot.docs.forEach((doc) => {
        if (!fetchedDocIds.has(doc.id)) {
          jobs.push(serializeJob(doc));
          fetchedDocIds.add(doc.id);
        }
      });
    };

    let baseQuery = adminDb.collection('jobs').where('status', '==', 'published');

    if (location) {
      baseQuery = baseQuery.where('location', '==', location);
    }
    if (jobLevel) {
      baseQuery = baseQuery.where('jobLevel', '==', jobLevel);
    }
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(t => t);
      if (tagsArray.length > 0) {
        baseQuery = baseQuery.where('tags', 'array-contains-any', tagsArray);
      }
    }

    // --- Multi-field Search Queries ---
    if (searchTerm) {
      // If a general search term is provided, prioritize it and combine with filters
      // Note: Firestore limitations mean we can't combine array-contains-any with range filters on other fields
      // For now, we'll perform separate queries and merge/deduplicate.

      // Search by Title (prefix match)
      await fetchAndProcess(
        baseQuery
          .where('title', '>=', searchTerm)
          .where('title', '<=', searchTerm + '\uf8ff')
          .orderBy('title')
          .orderBy('postedDate', 'desc')
      );

      // Search by Company (prefix match)
      await fetchAndProcess(
        baseQuery
          .where('company', '>=', searchTerm)
          .where('company', '<=', searchTerm + '\uf8ff')
          .orderBy('company')
          .orderBy('postedDate', 'desc')
      );

      // Search by Location (prefix match) - only if location filter is NOT already applied
      if (!location) {
        await fetchAndProcess(
          baseQuery
            .where('location', '>=', searchTerm)
            .where('location', '<=', searchTerm + '\uf8ff')
            .orderBy('location')
            .orderBy('postedDate', 'desc')
        );
      }

      // Search by Tags (array-contains-any) - only if tags filter is NOT already applied
      if (!tags) {
        const searchTags = searchTerm.split(',').map(tag => tag.trim()).filter(t => t);
        if (searchTags.length > 0) {
            await fetchAndProcess(
              baseQuery
                .where('tags', 'array-contains-any', searchTags)
                .orderBy('postedDate', 'desc')
            );
        }
      }

    } else {
      // If no search term, just apply the filters and order by postedDate
      await fetchAndProcess(
        baseQuery.orderBy('postedDate', 'desc')
      );
    }

    // --- Simple Relevance Scoring and Deduplication ---
    jobs.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(lowerSearchTerm);
      const bTitleMatch = b.title.toLowerCase().includes(lowerSearchTerm);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return (b.postedDate?.getTime() || 0) - (a.postedDate?.getTime() || 0);
    });

    if (fetchAll) {
      // Return all matched jobs without pagination
      res.status(200).json({
        jobs: jobs,
        lastVisible: null,
      });
    } else {
      // Manual pagination after merging and sorting
      const paginatedJobs = jobs.slice(0, limit);
      const lastVisibleJob =
        paginatedJobs.length > 0 ? paginatedJobs[paginatedJobs.length - 1] : null;

      res.status(200).json({
        jobs: paginatedJobs,
        lastVisible: lastVisibleJob ? lastVisibleJob.id : null,
      });
    }
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
