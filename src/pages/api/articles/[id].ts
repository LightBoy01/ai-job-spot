import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { Article, FirestoreArticle } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// This type represents the shape of the data coming from the frontend form
type ArticleFormData = Partial<Omit<Article, 'id' | 'publishDate' | 'tags'> & {
  tags: string;
  publishDate: string;
}>;

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

  const articleRef = adminDb.collection('articles').doc(id);

  switch (req.method) {
    case 'PUT':
      try {
        const articleData: ArticleFormData = req.body;

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
                errors.slug = 'URL Slug is required.';
            } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(articleData.slug)) {
                errors.slug = 'URL Slug must be lowercase, alphanumeric, and use hyphens.';
            }
        }
        if (articleData.contentBody !== undefined && (typeof articleData.contentBody !== 'string' || articleData.contentBody === '<p><br></p>')) {
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

        const updateData: Partial<FirestoreArticle> = {};

        // --- Data Sanitization & Transformation ---
        for (const key in articleData) {
            if (Object.prototype.hasOwnProperty.call(articleData, key)) {
                const value = articleData[key as keyof ArticleFormData];

                if (key === 'publishDate' && typeof value === 'string') {
                    updateData.publishDate = admin.firestore.Timestamp.fromDate(new Date(value));
                } else if (key === 'contentBody' && typeof value === 'string') {
                    updateData.contentBody = purify.sanitize(value);
                } else if (key === 'tags' && typeof value === 'string') {
                    updateData.tags = value.split(',').map(tag => tag.trim());
                } else if (key === 'issueNo' && value !== undefined) {
                    updateData.issueNo = Number(value);
                } else if (key === 'volumeNo' && value !== undefined) {
                    updateData.volumeNo = Number(value);
                } else if (value !== undefined) {
                    (updateData as Record<string, unknown>)[key] = value;
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        await articleRef.update(updateData);

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/'); // Revalidate home page
          await res.revalidate('/articles'); // Revalidate main articles list page
          await res.revalidate(`/articles/${id}`); // Revalidate specific article page
        } catch (revalError) {
          console.error('Error during revalidation after article update:', revalError);
        }

        res.status(200).json({ message: 'Article updated successfully' });
      } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).json({ error: 'Failed to update article' });
      }
      break;

    case 'DELETE':
      try {
        await articleRef.delete();

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/'); // Revalidate home page
          await res.revalidate('/articles'); // Revalidate main articles list page
          await res.revalidate(`/articles/${id}`); // Revalidate specific article page
        } catch (revalError) {
          console.error('Error during revalidation after article deletion:', revalError);
        }

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