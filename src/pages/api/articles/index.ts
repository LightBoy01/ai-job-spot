import type { NextApiResponse } from 'next';
import { getFirebaseAdmin, admin } from '@/lib/firebaseAdmin';
import { FirestoreArticle } from '@/lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { ArticleSchema } from '@/lib/validationSchemas'; // Import Zod schema
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked'; // Import marked for HTML sanitization

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === 'POST') {
    try {
      const { adminDb } = await getFirebaseAdmin();
      // Validate input with Zod schema
      const validationResult = ArticleSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid article data',
          errors: validationResult.error.flatten(),
        });
      }

      const articleData = validationResult.data;

      const sanitizedContentBody = DOMPurify.sanitize(
        await marked(articleData.contentBody || '')
      );
      const plainTextContent = (articleData.contentBody || '')
        .replace(/\n/g, ' ')
        .replace(/(\**|\*|_|`|\[|\]|\(|\)|#)/g, '');
      const excerpt = plainTextContent.substring(0, 160);

      const dataToCreate: Omit<FirestoreArticle, 'id'> = {
        title: articleData.title,
        author: articleData.author,
        slug: articleData.slug,
        contentBody: sanitizedContentBody,
        excerpt: excerpt,
        publishDate: articleData.publishDate
          ? admin.firestore.Timestamp.fromDate(
              new Date(articleData.publishDate)
            )
          : admin.firestore.Timestamp.now(),
        tags: articleData.tags || [],
        issueNo: articleData.issueNo,
        volumeNo: articleData.volumeNo,
        imageUrl: articleData.imageUrl || null,
        author_take_question1:
          articleData.author_take_question1 === null
            ? undefined
            : articleData.author_take_question1,
        author_take_answer1:
          articleData.author_take_answer1 === null
            ? undefined
            : articleData.author_take_answer1,
        author_take_question2:
          articleData.author_take_question2 === null
            ? undefined
            : articleData.author_take_question2,
        author_take_answer2:
          articleData.author_take_answer2 === null
            ? undefined
            : articleData.author_take_answer2,
      };

      const docRef = await adminDb.collection('articles').add(dataToCreate);

      res
        .status(201)
        .json({ message: 'Article created successfully', id: docRef.id });
    } catch (error) {
      console.error('Error adding document: ', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
