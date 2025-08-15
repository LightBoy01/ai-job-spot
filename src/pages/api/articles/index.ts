
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

  if (req.method === 'POST') {
    try {
      const articleData: Omit<Article, 'id'> = req.body;

      // Basic validation
      if (!articleData.title || !articleData.contentBody || !articleData.slug) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const sanitizedContentBody = purify.sanitize(articleData.contentBody);

      // Use adminDb for server-side operations that bypass security rules
      const docRef = await adminDb.collection('articles').add({
        ...articleData,
        contentBody: sanitizedContentBody,
        publishDate: admin.firestore.FieldValue.serverTimestamp(), // Use admin.firestore.FieldValue.serverTimestamp()
      });

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
