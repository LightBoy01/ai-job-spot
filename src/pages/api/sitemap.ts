import { NextApiRequest, NextApiResponse } from 'next';
import { getJobs, getArticles } from '../../lib/firestoreClient'; // Adjust path as needed
import * as admin from 'firebase-admin';

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL; // Your actual website URL

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
    const { jobs } = await getJobs();
    const { articles } = await getArticles();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${WEBSITE_URL}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/articles</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>${WEBSITE_URL}/jobs</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

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
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}