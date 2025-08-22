
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { Article, FirestoreArticle } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

// This type represents the shape of the data coming from the frontend form
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
      if (!articleData.title) errors.title = 'Article Title is required.';
      if (!articleData.author) errors.author = 'Author is required.';
      if (!articleData.slug) {
        errors.slug = 'URL Slug is required.';
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(articleData.slug)) {
        errors.slug = 'URL Slug must be lowercase, alphanumeric, and use hyphens.';
      }
      if (!articleData.contentBody || articleData.contentBody === '<p><br></p>') {
        errors.contentBody = 'Article Content is required.';
      }
      if (articleData.issueNo !== undefined && (isNaN(Number(articleData.issueNo)) || Number(articleData.issueNo) <= 0)) {
        errors.issueNo = 'Issue Number must be a positive number.';
      }
      if (articleData.volumeNo !== undefined && (isNaN(Number(articleData.volumeNo)) || Number(articleData.volumeNo) <= 0)) {
        errors.volumeNo = 'Volume Number must be a positive number.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      // --- End Validation ---

      const sanitizedContentBody = purify.sanitize(articleData.contentBody || '');

      // After validation, we can confidently build the Firestore object
      const dataToCreate: Omit<FirestoreArticle, 'id'> = {
        title: articleData.title!,
        author: articleData.author!,
        slug: articleData.slug!,
        contentBody: sanitizedContentBody,
        publishDate: articleData.publishDate ? admin.firestore.Timestamp.fromDate(new Date(articleData.publishDate)) : admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        tags: articleData.tags ? articleData.tags.split(',').map((tag) => tag.trim()) : [],
        issueNo: articleData.issueNo ? Number(articleData.issueNo) : undefined,
        volumeNo: articleData.volumeNo ? Number(articleData.volumeNo) : undefined,
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
