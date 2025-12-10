import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../../lib/firebaseAdmin';

// Cache for 1 hour (3600 seconds)
const CACHE_TTL = 3600;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Enable CORS (Critical for widgets embedded on other sites)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any domain to fetch this
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Setup Caching (Critical for performance and cost)
  // s-maxage tells Vercel's CDN to cache this response.
  // stale-while-revalidate allows serving old data while fetching new in the background.
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`
  );

  try {
    const { adminDb } = await getFirebaseAdmin();
    const limit = Number(req.query.limit) || 5;
    const tag = req.query.tag as string;

    let query = adminDb.collection('jobs')
      .where('status', '==', 'published')
      .orderBy('postedDate', 'desc')
      .limit(limit);

    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    const snapshot = await query.get();

    const jobs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        company: data.company,
        location: data.location,
        // We construct the absolute URL so the link works anywhere
        url: `https://aijobspot.online/jobs/${doc.id}?ref=widget`,
        postedDate: data.postedDate.toDate().toISOString(),
        salaryRange: data.salaryRange || null
      };
    });

    res.status(200).json({
      meta: {
        source: 'AI Job Spot',
        link: 'https://aijobspot.online',
        generatedAt: new Date().toISOString()
      },
      jobs
    });

  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}
