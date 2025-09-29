
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../../lib/firebaseAdmin';
import { FirestoreArticle } from '../../../lib/types';
import * as admin from 'firebase-admin'; // Add this import

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';
const SITEMAP_PAGE_SIZE = 1000; // Number of URLs per sitemap file

const formatDate = (date: admin.firestore.Timestamp): string => {
  return date.toDate().toISOString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const page = parseInt(req.query.page as string, 10) || 1;
  if (page < 1) {
    return res.status(400).json({ error: 'Page number must be 1 or greater.' });
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    const offset = (page - 1) * SITEMAP_PAGE_SIZE;

    const articlesSnapshot = await adminDb
      .collection('articles')
      .orderBy('publishDate', 'desc')
      .limit(SITEMAP_PAGE_SIZE)
      .offset(offset)
      .get();

    const articles = articlesSnapshot.docs.map((doc) => doc.data() as FirestoreArticle);

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    articles.forEach((article) => {
      if (article.publishDate) {
        sitemap += `\n  <url>\n    <loc>${WEBSITE_URL}/articles/${article.slug}</loc>\n    <lastmod>${formatDate(article.publishDate)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    });

    sitemap += `\n</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=60' // 1 hour cache
    );
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating articles sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
