
import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting } from '@/lib/types';
import { PSEO_MIN_JOB_COUNT } from '@/lib/constants';
import { getAllToolSlugs } from '@/lib/tools';

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

    // Optimize counting using Maps (O(N) complexity)
    const skillCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const skillLocationCounts = new Map<string, number>();

    jobs.forEach(job => {
      const jobTags = job.tags || [];
      const jobLocation = job.location;

      // Count Skills
      jobTags.forEach(tag => {
        skillCounts.set(tag, (skillCounts.get(tag) || 0) + 1);

        // Count Skill + Location combinations
        if (jobLocation) {
          // Use a delimiter that won't appear in normal text, e.g., '|||'
          const comboKey = `${tag}|||${jobLocation}`;
          skillLocationCounts.set(comboKey, (skillLocationCounts.get(comboKey) || 0) + 1);
        }
      });

      // Count Locations
      if (jobLocation) {
        locationCounts.set(jobLocation, (locationCounts.get(jobLocation) || 0) + 1);
      }
    });

    const lastModified = new Date().toISOString();
    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    const validUrls = new Set<string>();

    // 1. Single Dimension URLs (Skills)
    for (const [skill, count] of skillCounts.entries()) {
      if (count >= PSEO_MIN_JOB_COUNT) {
        // Use exact casing from DB to ensure Firestore matches
        validUrls.add(`${WEBSITE_URL}/tags/${encodeURIComponent(skill)}`);
      }
    }

    // Single Dimension URLs (Locations)
    for (const [location, count] of locationCounts.entries()) {
      if (count >= PSEO_MIN_JOB_COUNT) {
         validUrls.add(`${WEBSITE_URL}/jobs/location/${encodeURIComponent(location)}`);
      }
    }

    // 2. Multi-Dimension URLs (skill + location)
    for (const [comboKey, count] of skillLocationCounts.entries()) {
      if (count >= PSEO_MIN_JOB_COUNT) {
        const [skill, location] = comboKey.split('|||');
        validUrls.add(`${WEBSITE_URL}/jobs/skill/${encodeURIComponent(skill)}/location/${encodeURIComponent(location)}`);
      }
    }

    // 3. Tool Hub URLs
    const toolSlugs = getAllToolSlugs();
    for (const slug of toolSlugs) {
        validUrls.add(`${WEBSITE_URL}/tools/${slug}`);
    }

    // 4. Static Tool Pages
    validUrls.add(`${WEBSITE_URL}/tools`);
    validUrls.add(`${WEBSITE_URL}/tools/career-simulator`);

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
