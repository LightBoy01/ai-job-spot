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

interface ArticleDocumentData {
  author: string;
  excerpt?: string;
  imageUrl?: null | string; // Fixed: null before string
  issueNo?: number;
  publishDate: unknown; // This will be Timestamp or string
  slug: string;
  tags?: string[];
  title: string;
  volumeNo?: number;
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

    let articlesQuery: Query = adminDb
      .collection('articles')
      .where('status', '==', 'published')
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
    const articles = snapshot.docs.map((doc) => {
      const data = doc.data() as ArticleDocumentData; // Cast to our interface
      return {
        author: data.author,
        excerpt: data.excerpt ?? '',
        id: doc.id,
        imageUrl: data.imageUrl ?? null,
        issueNo: data.issueNo,
        publishDate: isTimestamp(data.publishDate)
          ? data.publishDate.toDate().toISOString()
          : (data.publishDate as string) || '', // Ensure it's a string
        slug: data.slug,
        tags: data.tags ?? [],
        title: data.title,
        volumeNo: data.volumeNo,
      };
    });
    const lastVisible =
      snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    res.status(200).json({ articles, lastVisible });
  } catch (error) {
    console.error('Error paginating articles by tag:', error);
    const message = isErrorWithMessage(error)
      ? error.message
      : 'Internal server error';
    res.status(500).json({ message });
  }
}
