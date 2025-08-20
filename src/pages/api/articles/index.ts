
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
import * as admin from 'firebase-admin';
import { Article } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

type ArticleFormData = Partial<Omit<Article, 'id' | 'publishDate' | 'tags'> & {
  tags: string;
  publishDate: string;
}>;

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === 'POST') {
    try {
      const articleData: ArticleFormData = req.body;

      // --- Comprehensive Server-Side Validation ---
      const errors: Record<string, string> = {};
      if (!articleData.title || typeof articleData.title !== 'string') {
        errors.title = 'Article Title is required and must be a string.';
      }
      if (!articleData.author || typeof articleData.author !== 'string') {
        errors.author = 'Author is required and must be a string.';
      }
      if (!articleData.slug || typeof articleData.slug !== 'string') {
        errors.slug = 'URL Slug is required and must be a string.';
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(articleData.slug)) {
        errors.slug = 'URL Slug must be lowercase, alphanumeric, and use hyphens.';
      }
      if (!articleData.contentBody || typeof articleData.contentBody !== 'string' || articleData.contentBody === '<p><br></p>') {
        errors.contentBody = 'Article Content is required.';
      }
      if (articleData.issueNo && (typeof articleData.issueNo !== 'number' || articleData.issueNo <= 0)) {
        errors.issueNo = 'Issue Number must be a positive number.';
      }
      if (articleData.volumeNo && (typeof articleData.volumeNo !== 'number' || articleData.volumeNo <= 0)) {
        errors.volumeNo = 'Volume Number must be a positive number.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      // --- End Validation ---

      const sanitizedContentBody = purify.sanitize(articleData.contentBody || '');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataToCreate: { [key: string]: any } = {
        ...articleData,
        contentBody: sanitizedContentBody,
        publishDate: articleData.publishDate ? admin.firestore.Timestamp.fromDate(new Date(articleData.publishDate)) : admin.firestore.FieldValue.serverTimestamp(),
        tags: (typeof articleData.tags === 'string') ? (articleData.tags as unknown as string).split(',').map((tag: string) => tag.trim()) : [],
      };

      const docRef = await adminDb.collection('articles').add(dataToCreate);

      res.status(201).json({ id: docRef.id });
    } catch (error) {
      console.error('Error adding document: ', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
