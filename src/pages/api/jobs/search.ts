import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { SerializedJobPosting, FirestoreJobPosting } from '@/lib/types';

export default async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('[jobs/search] Received search request.');
    const { q } = req.query;

    if (typeof q !== 'string' || q.trim() === '') {
      console.log('[jobs/search] Invalid search query:', q);
      return res.status(400).json({ error: 'Search query must be a non-empty string.' });
    }

    const jobsRef = adminDb.collection('jobs');
    const searchTerm = q.trim();
    console.log(`[jobs/search] Searching for: "${searchTerm}"`);

    const snapshot = await jobsRef
      .where('title', '>=', searchTerm)
      .where('title', '<=', searchTerm + '\uf8ff')
      .limit(15)
      .get();

    console.log(`[jobs/search] Found ${snapshot.docs.length} documents.`);

    if (snapshot.empty) {
      console.log('[jobs/search] No jobs found for search term.');
      return res.status(200).json([]);
    }

    const jobs = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreJobPosting; // Cast as FirestoreJobPosting
        // Ensure postedDate is a valid Date object before calling toISOString()
        const validPostedDate = data.postedDate instanceof Date ? data.postedDate : (data.postedDate && typeof data.postedDate.toDate === 'function' ? data.postedDate.toDate() : new Date());
        const postedDateISO = validPostedDate.toISOString();

        // Ensure expirationDate is a valid Date object before calling toISOString()
        const validExpirationDate = data.expirationDate instanceof Date ? data.expirationDate : (data.expirationDate && typeof data.expirationDate.toDate === 'function' ? data.expirationDate.toDate() : null);
        const expirationDateISO = validExpirationDate ? validExpirationDate.toISOString() : null;

        // Construct the SerializedJobPosting object directly
        return {
            id: doc.id,
            title: data.title,
            company: data.company,
            description: data.description,
            responsibilities: data.responsibilities,
            qualifications: data.qualifications,
            preferredQualifications: data.preferredQualifications,
            location: data.location,
            salaryRange: data.salaryRange,
            applicationLink: data.applicationLink,
            tags: data.tags,
            jobLevel: data.jobLevel,
            employeeRole: data.employeeRole,
            status: data.status,
            isNew: data.isNew,
            source: data.source,
            postedDate: postedDateISO,
            expirationDate: expirationDateISO,
        } as SerializedJobPosting;
    });

    console.log(`[jobs/search] Successfully processed ${jobs.length} jobs.`);
    res.status(200).json(jobs);

  } catch (error) {
    console.error('[jobs/search] Error searching jobs:', error);
    // Log the full error object for more details
    if (error instanceof Error) {
      console.error('[jobs/search] Error details:', error.message, error.stack);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
