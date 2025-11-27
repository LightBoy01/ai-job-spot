import type { NextApiRequest, NextApiResponse } from 'next';

import { Query, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { isErrorWithMessage } from '@/lib/utils';

const paginateSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  startAfter: z.string().max(100).optional(),
  tag: z.string().min(1).max(100),
});

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

interface JobDocumentData {
  applicationLink: string;
  company: string;
  companyLogoUrl?: null | string; // Fixed: null before string
  expirationDate: unknown; // This will be Timestamp or null
  isFeatured?: boolean;
  isNew?: boolean;
  jobLevel?: null | string; // Fixed: null before string
  location: string;
  postedDate: unknown; // This will be Timestamp
  salaryRange?: null | string; // Fixed: null before string
  source?: null | string; // Fixed: null before string
  sourceUrl?: null | string; // Fixed: null before string
  status: string; // Assuming status is always a string
  tags?: string[];
  title: string;
  verificationDate?: unknown; // This will be Timestamp or null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    const validation = paginateSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        errors: validation.error.flatten(),
        message: 'Invalid query parameters.',
      });
    }

    const { limit, startAfter: startAfterId, tag } = validation.data;

    let jobsQuery: Query = adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .where('tags', 'array-contains', tag)
      .orderBy('postedDate', 'desc');

    if (startAfterId) {
      const startAfterDoc = await adminDb
        .collection('jobs')
        .doc(startAfterId)
        .get();
      if (startAfterDoc.exists) {
        jobsQuery = jobsQuery.startAfter(startAfterDoc);
      }
    }

    const snapshot = await jobsQuery.limit(limit).get();
    const jobs = snapshot.docs.map((doc) => {
      const data = doc.data() as JobDocumentData; // Cast to our interface
      return {
        applicationLink: data.applicationLink,
        company: data.company,
        companyLogoUrl: data.companyLogoUrl ?? null,
        expirationDate:
          data.expirationDate && isTimestamp(data.expirationDate)
            ? data.expirationDate.toDate().toISOString()
            : null,
        id: doc.id,
        isFeatured: data.isFeatured ?? false,
        isNew: data.isNew ?? false,
        jobLevel: data.jobLevel ?? null,
        location: data.location,
        postedDate: isTimestamp(data.postedDate)
          ? data.postedDate.toDate().toISOString()
          : new Date().toISOString(), // Fallback for postedDate
        salaryRange: data.salaryRange ?? null,
        source: data.source ?? null,
        sourceUrl: data.sourceUrl ?? null,
        tags: data.tags ?? [],
        title: data.title,
        verificationDate:
          data.verificationDate && isTimestamp(data.verificationDate)
            ? data.verificationDate.toDate().toISOString()
            : null,
      };
    });
    const lastVisible =
      snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    res.status(200).json({ jobs, lastVisible });
  } catch (error) {
    console.error('Error paginating jobs by tag:', error);
    const message = isErrorWithMessage(error)
      ? error.message
      : 'Internal server error';
    res.status(500).json({ message });
  }
}
