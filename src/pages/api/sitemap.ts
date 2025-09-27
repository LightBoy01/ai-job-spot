import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../lib/firebaseAdmin';
import { JobPosting, Article } from '../../lib/types';
import * as admin from 'firebase-admin';

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';

const formatDate = (date: Date | admin.firestore.Timestamp): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date.toDate().toISOString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobsSnapshot = await adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .get();
    const jobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as JobPosting[];

    const articlesSnapshot = await adminDb.collection('articles').get();
    const articles = articlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${WEBSITE_URL}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/articles</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/jobs</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/about</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/contact</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/post-a-job</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/privacy</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/terms</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;

    jobs.forEach((job) => {
      if (job.postedDate) {
        sitemap += `
  <url>
    <loc>${WEBSITE_URL}/jobs/${job.id}</loc>
    <lastmod>${formatDate(job.postedDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    });

    articles.forEach((article) => {
      if (article.publishDate) {
        sitemap += `\n  <url>\n    <loc>${WEBSITE_URL}/articles/${article.slug}</loc>\n    <lastmod>${formatDate(article.publishDate)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    });

    sitemap += `\n</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=60'
    );
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
