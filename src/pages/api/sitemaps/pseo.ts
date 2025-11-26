
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting } from '@/lib/types';
import { PSEO_MIN_JOB_COUNT } from '@/lib/constants';

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';

// Helper to generate XML for a single sitemap URL
const createSitemapEntry = (loc: string, lastmod: string) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const snapshot = await adminDb.collection('jobs').where('status', '==', 'published').get();
    
    const jobs: FirestoreJobPosting[] = [];
    snapshot.forEach((doc) => {
      jobs.push(doc.data() as FirestoreJobPosting);
    });

    const uniqueSkills = [...new Set(jobs.flatMap(job => job.tags || []))];
    const uniqueLocations = [...new Set(jobs.map(job => job.location).filter(Boolean))];

    const lastModified = new Date().toISOString();
    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    const validUrls = new Set<string>();

    // 1. Single Dimension URLs
    for (const skill of uniqueSkills) {
      const count = jobs.filter(j => j.tags?.includes(skill)).length;
      if (count >= PSEO_MIN_JOB_COUNT) {
        validUrls.add(`${WEBSITE_URL}/jobs/skill/${encodeURIComponent(skill.toLowerCase())}`);
      }
    }
    for (const location of uniqueLocations) {
      const count = jobs.filter(j => j.location === location).length;
      if (count >= PSEO_MIN_JOB_COUNT) {
        validUrls.add(`${WEBSITE_URL}/jobs/location/${encodeURIComponent(location)}`);
      }
    }

    // 2. Multi-Dimension URLs (skill + location)
    for (const skill of uniqueSkills) {
      for (const location of uniqueLocations) {
        const count = jobs.filter(j => j.tags?.includes(skill) && j.location === location).length;
        if (count >= PSEO_MIN_JOB_COUNT) {
          validUrls.add(`${WEBSITE_URL}/jobs/skill/${encodeURIComponent(skill.toLowerCase())}/location/${encodeURIComponent(location)}`);
        }
      }
    }

    for (const url of validUrls) {
      sitemapXml += createSitemapEntry(url, lastModified);
    }

    sitemapXml += '\n</urlset>';

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=60'); // 24 hour cache
    res.status(200).send(sitemapXml);

  } catch (error) {
    console.error('Error generating pSEO sitemap:', error);
    res.status(500).send('Error generating pSEO sitemap');
  }
}
