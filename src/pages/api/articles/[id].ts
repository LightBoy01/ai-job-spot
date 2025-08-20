
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
import * as admin from 'firebase-admin';
import { Article } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid article ID' });
  }

  // Use adminDb for server-side operations that bypass security rules
  const articleRef = adminDb.collection('articles').doc(id);

  switch (req.method) {
    case 'PUT':
      try {
        const articleData: Partial<Article> = req.body;

        // --- Comprehensive Server-Side Validation ---
        const errors: Record<string, string> = {};
        if (articleData.title !== undefined && (typeof articleData.title !== 'string' || !articleData.title)) {
          errors.title = 'Article Title must be a non-empty string.';
        }
        if (articleData.author !== undefined && (typeof articleData.author !== 'string' || !articleData.author)) {
          errors.author = 'Author must be a non-empty string.';
        }
        if (articleData.slug !== undefined) {
          if (typeof articleData.slug !== 'string' || !articleData.slug) {
            errors.slug = 'URL Slug must be a non-empty string.';
          } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(articleData.slug)) {
            errors.slug = 'URL Slug must be lowercase, alphanumeric, and use hyphens.';
          }
        }
        if (articleData.contentBody !== undefined && (typeof articleData.contentBody !== 'string' || articleData.contentBody === '<p><br></p>')) {
          errors.contentBody = 'Article Content is required.';
        }
        if (articleData.issueNo !== undefined && (typeof articleData.issueNo !== 'number' || articleData.issueNo <= 0)) {
          errors.issueNo = 'Issue Number must be a positive number.';
        }
        if (articleData.volumeNo !== undefined && (typeof articleData.volumeNo !== 'number' || articleData.volumeNo <= 0)) {
          errors.volumeNo = 'Volume Number must be a positive number.';
        }

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        // --- End Validation ---

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataToUpdate: { [key: string]: any } = { ...articleData };

        if (dataToUpdate.contentBody) {
          dataToUpdate.contentBody = purify.sanitize(dataToUpdate.contentBody);
        }
        if (dataToUpdate.publishDate) {
          dataToUpdate.publishDate = admin.firestore.Timestamp.fromDate(new Date(dataToUpdate.publishDate));
        }

        await articleRef.update(dataToUpdate);

        res.status(200).json({ message: 'Article updated successfully' });
      } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).json({ error: 'Failed to update article' });
      }
      break;

    case 'DELETE':
      try {
        await articleRef.delete();
        res.status(200).json({ message: 'Article deleted successfully' });
      } catch (error) {
        console.error('Error deleting document: ', error);
        res.status(500).json({ error: 'Failed to delete article' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
