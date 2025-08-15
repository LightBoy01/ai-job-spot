
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
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

        // Basic validation
        if (Object.keys(articleData).length === 0) {
          return res.status(400).json({ error: 'Request body cannot be empty' });
        }

        const sanitizedContentBody = articleData.contentBody
          ? purify.sanitize(articleData.contentBody)
          : undefined;

        await articleRef.update({
          ...articleData,
          ...(sanitizedContentBody && { contentBody: sanitizedContentBody }),
        });

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
