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

    let articlesQuery: Query = adminDb
      .collection('articles')
      .where('tags', 'array-contains', tag)
      .orderBy('publishDate', 'desc');

    if (startAfterId) {
      const startAfterDoc = await adminDb
        .collection('articles')
        .doc(startAfterId)
        .get();
      if (startAfterDoc.exists) {
        articlesQuery = articlesQuery.startAfter(startAfterDoc);
      }
    }

    const snapshot = await articlesQuery.limit(limit).get();
    const articles = snapshot.docs.map(doc => {
      const data = doc.data()!;
      return {
        id: doc.id,
        title: data.title,
        author: data.author,
        publishDate: data.publishDate ? data.publishDate.toDate().toISOString() : '',
        slug: data.slug,
        issueNo: data.issueNo,
        volumeNo: data.volumeNo,
        imageUrl: data.imageUrl ?? null,
        tags: data.tags ?? [],
        excerpt: data.excerpt ?? '',
      };
    });
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    res.status(200).json({ articles, lastVisible });
  } catch (error) {
    console.error('Error paginating articles by tag:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
