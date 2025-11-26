import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../lib/firebaseAdmin';

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';
const SITEMAP_PAGE_SIZE = 1000; // This should be the same as in the paginated sitemap files

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { adminDb } = await getFirebaseAdmin();

    // Get counts for jobs and articles
    const jobsSnapshot = await adminDb.collection('jobs').where('status', '==', 'published').get();
    const articlesSnapshot = await adminDb.collection('articles').get();
    const jobCount = jobsSnapshot.size;
    const articleCount = articlesSnapshot.size;

    const jobPages = Math.ceil(jobCount / SITEMAP_PAGE_SIZE);
    const articlePages = Math.ceil(articleCount / SITEMAP_PAGE_SIZE);

    const lastModified = new Date().toISOString();

    let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages sitemap (can be a separate file or included in one of the dynamic ones if preferred)
    // For simplicity, we can create a static sitemap entry if we had one, or just list them.
    // Here, we'll point to a conceptual static sitemap.
    sitemapIndex += `
  <sitemap>
    <loc>${WEBSITE_URL}/sitemap-static.xml</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`;

    // Job sitemap pages
    for (let i = 1; i <= jobPages; i++) {
      sitemapIndex += `
  <sitemap>
    <loc>${WEBSITE_URL}/api/sitemaps/jobs?page=${i}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`;
    }

    // Article sitemap pages
    for (let i = 1; i <= articlePages; i++) {
      sitemapIndex += `
  <sitemap>
    <loc>${WEBSITE_URL}/api/sitemaps/articles?page=${i}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`;
    }

    // pSEO sitemap
    sitemapIndex += `
  <sitemap>
    <loc>${WEBSITE_URL}/api/sitemaps/pseo</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`;

    sitemapIndex += '\n</sitemapindex>';

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=60' // 1 hour cache
    );
    res.status(200).send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
}