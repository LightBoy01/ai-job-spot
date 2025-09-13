import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import { Article, FirestoreArticle } from '../../../lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';
import { validatePayload, isRequired, safeToTimestamp } from '../../../lib/apiUtils';

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

        // Since this is a partial update, we only validate the fields that are present.
        const errors = validatePayload(articleData, {
            title: [isRequired('Article Title')],
            author: [isRequired('Author')],
            slug: [isRequired('URL Slug')],
            contentBody: [isRequired('Article Content')],
        });

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({ message: 'Validation failed', details: errors });
        }

        const updateData: Partial<FirestoreArticle> = {};

        // Build the update object safely, only including fields that were passed
        if (articleData.title) updateData.title = articleData.title;
        if (articleData.author) updateData.author = articleData.author;
        if (articleData.slug) updateData.slug = articleData.slug;
        if (articleData.contentBody) updateData.contentBody = DOMPurify.sanitize(articleData.contentBody);
        if (articleData.tags) updateData.tags = articleData.tags.split(',').map(tag => tag.trim());
        if (articleData.issueNo) updateData.issueNo = Number(articleData.issueNo);
        if (articleData.volumeNo) updateData.volumeNo = Number(articleData.volumeNo);
        if (articleData.imageUrl) updateData.imageUrl = articleData.imageUrl;
        if (articleData.publishDate) {
            const timestamp = safeToTimestamp(articleData.publishDate, 'now');
            if (timestamp) {
                updateData.publishDate = timestamp;
            }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        await articleRef.update(updateData);

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/');
          await res.revalidate('/articles');
          await res.revalidate(`/articles/${id}`);
          if (articleData.slug && articleData.slug !== id) {
            // If the slug changed, revalidate the old path as well if possible
            // Note: This requires knowing the old slug, which we don't have here.
            // A more advanced implementation might store old slugs or handle redirects.
            await res.revalidate(`/articles/${articleData.slug}`);
          }
        } catch (revalError) {
          console.error('Error during revalidation after article update:', revalError);
        }

        const updatedDoc = await articleRef.get();
        const updatedArticleData = updatedDoc.data() as FirestoreArticle;

        const finalArticle = {
          id: updatedDoc.id,
          ...updatedArticleData,
          publishDate: updatedArticleData.publishDate.toDate().toISOString(),
        };

        res.status(200).json({ message: 'Article updated successfully', article: finalArticle });
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