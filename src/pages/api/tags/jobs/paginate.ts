import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import { Query } from 'firebase-admin/firestore';

const paginateSchema = z.object({
  tag: z.string().min(1).max(100),
  startAfter: z.string().max(100).optional(),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

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
        message: 'Invalid query parameters.',
        errors: validation.error.flatten(),
      });
    }

    const { tag, startAfter: startAfterId, limit } = validation.data;

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
    const jobs = snapshot.docs.map(doc => {
      const data = doc.data()!;
      return {
        id: doc.id,
        title: data.title,
        company: data.company,
        location: data.location,
        salaryRange: data.salaryRange ?? null,
        isNew: data.isNew ?? false,
        isFeatured: data.isFeatured ?? false,
        companyLogoUrl: data.companyLogoUrl ?? null,
        verificationDate: data.verificationDate ? data.verificationDate.toDate().toISOString() : null,
        sourceUrl: data.sourceUrl ?? null,
        jobLevel: data.jobLevel ?? null,
        source: data.source ?? null,
        tags: data.tags ?? [],
        postedDate: data.postedDate.toDate().toISOString(),
        expirationDate: data.expirationDate ? data.expirationDate.toDate().toISOString() : null,
        applicationLink: data.applicationLink, // <-- ADDED THIS LINE
      };
    });
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    res.status(200).json({ jobs, lastVisible });
  } catch (error) {
    console.error('Error paginating jobs by tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
