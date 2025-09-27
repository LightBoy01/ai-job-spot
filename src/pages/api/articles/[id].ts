import type { NextApiResponse } from 'next';
import { getFirebaseAdmin, admin } from '@/lib/firebaseAdmin';
import { FirestoreArticle } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { ArticleSchema } from '@/lib/validationSchemas'; // Import Zod schema
import { marked } from 'marked'; // Import marked for HTML sanitization

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

  const { adminDb } = await getFirebaseAdmin();
  const articleRef = adminDb.collection('articles').doc(id);

  switch (req.method) {
    case 'PUT':
      try {
        // Validate input with Zod schema
        const validationResult = ArticleSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            message: 'Invalid article data',
            errors: validationResult.error.flatten(),
          });
        }

        const articleData = validationResult.data;

        const updateData: Partial<FirestoreArticle> = {};

        // Map validated data to Firestore format
        if (articleData.title !== undefined)
          updateData.title = articleData.title;
        if (articleData.author !== undefined)
          updateData.author = articleData.author;
        if (articleData.slug !== undefined) updateData.slug = articleData.slug;
        if (articleData.issueNo !== undefined)
          updateData.issueNo = articleData.issueNo;
        if (articleData.volumeNo !== undefined)
          updateData.volumeNo = articleData.volumeNo;
        if (articleData.imageUrl !== undefined)
          updateData.imageUrl = articleData.imageUrl;
        if (articleData.excerpt !== undefined)
          updateData.excerpt = articleData.excerpt;
        if (articleData.author_take_question1 !== undefined)
          updateData.author_take_question1 =
            articleData.author_take_question1 === null
              ? undefined
              : articleData.author_take_question1;
        if (articleData.author_take_answer1 !== undefined)
          updateData.author_take_answer1 =
            articleData.author_take_answer1 === null
              ? undefined
              : articleData.author_take_answer1;
        if (articleData.author_take_question2 !== undefined)
          updateData.author_take_question2 =
            articleData.author_take_question2 === null
              ? undefined
              : articleData.author_take_question2;
        if (articleData.author_take_answer2 !== undefined)
          updateData.author_take_answer2 =
            articleData.author_take_answer2 === null
              ? undefined
              : articleData.author_take_answer2;

        // HTML Sanitization for contentBody
        if (articleData.contentBody !== undefined) {
          updateData.contentBody = DOMPurify.sanitize(
            await marked(articleData.contentBody)
          );
        }

        // Convert tags string to array
        if (articleData.tags !== undefined) updateData.tags = articleData.tags;

        // Convert publishDate to Firestore Timestamp
        if (articleData.publishDate !== undefined)
          updateData.publishDate = admin.firestore.Timestamp.fromDate(
            new Date(articleData.publishDate)
          );

        if (Object.keys(updateData).length === 0) {
          return res
            .status(400)
            .json({ error: 'No valid fields provided for update.' });
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
          console.error(
            'Error during revalidation after article update:',
            revalError
          );
        }

        const updatedDoc = await articleRef.get();
        const updatedArticleData = updatedDoc.data() as FirestoreArticle;

        const finalArticle = {
          id: updatedDoc.id,
          ...updatedArticleData,
          publishDate: updatedArticleData.publishDate.toDate().toISOString(),
        };

        res.status(200).json({
          message: 'Article updated successfully',
          article: finalArticle,
        });
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
          console.error(
            'Error during revalidation after article deletion:',
            revalError
          );
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
