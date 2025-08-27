
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import { Article, FirestoreArticle } from '../../../lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';
import { validatePayload, isRequired, safeToTimestamp } from '../../../lib/apiUtils';
import DOMPurify from 'isomorphic-dompurify';

// This type represents the shape of the data coming from the frontend form
type ArticleFormData = Partial<Omit<Article, 'id' | 'publishDate' | 'tags'> & {
  tags: string;
  publishDate: string;
}>;

const validationSchema = {
  title: [isRequired('Article Title')],
  author: [isRequired('Author')],
  slug: [isRequired('URL Slug')], // Basic check, can add regex later
  contentBody: [isRequired('Article Content')],
};

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

      const errors = validatePayload(articleData, validationSchema);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Validation failed', details: errors });
      }

      const sanitizedContentBody = DOMPurify.sanitize(articleData.contentBody || '');
      const plainTextContent = (articleData.contentBody || '').replace(/\n/g, ' ').replace(/(\**|\*|_|`|\[|\]|\(|\)|#)/g, '');
      const excerpt = plainTextContent.substring(0, 160);

      const dataToCreate: Omit<FirestoreArticle, 'id'> = {
        title: articleData.title!,
        author: articleData.author!,
        slug: articleData.slug!,
        contentBody: sanitizedContentBody,
        excerpt: excerpt,
        publishDate: safeToTimestamp(articleData.publishDate, 'now')!,
        tags: articleData.tags ? articleData.tags.split(',').map((tag) => tag.trim()) : [],
        issueNo: articleData.issueNo ? Number(articleData.issueNo) : undefined,
        volumeNo: articleData.volumeNo ? Number(articleData.volumeNo) : undefined,
        imageUrl: articleData.imageUrl || null,
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
