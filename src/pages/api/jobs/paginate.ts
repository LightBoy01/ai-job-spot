import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import { SerializedJobPosting } from '../../../lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { limit, startAfter } = req.query;

  let query: FirebaseFirestore.Query = adminDb.collection('jobs')
    .where('status', '==', 'published')
    .orderBy('postedDate', 'desc');

  if (limit && typeof limit === 'string') {
    query = query.limit(parseInt(limit as string, 10));
  } else {
    query = query.limit(10); // Default limit
  }

  if (startAfter && typeof startAfter === 'string') {
    const startAfterDoc = await adminDb.collection('jobs').doc(startAfter).get();
    if (startAfterDoc.exists) {
      query = query.startAfter(startAfterDoc);
    }
  }

  try {
    const snapshot = await query.get();
    const jobs: SerializedJobPosting[] = [];
    let lastDocId: string | null = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter out expired jobs on the server side
      const now = new Date();
      const expirationDate = data.expirationDate ? data.expirationDate.toDate() : null;

      if (!expirationDate || expirationDate.getTime() > now.getTime()) {
        jobs.push({
          id: doc.id,
          title: data.title,
          company: data.company,
          location: data.location,
          jobLevel: data.jobLevel || null,
          employeeRole: data.employeeRole || null,
          applicationLink: data.applicationLink,
          postedDate: data.postedDate.toDate().toISOString(),
          expirationDate: expirationDate ? expirationDate.toISOString() : null,
          tags: data.tags || [],
          status: data.status,
          isNew: data.isNew || false,
          salaryRange: data.salaryRange || null,
          source: data.source || null,
          description: data.description || '',
          responsibilities: data.responsibilities || [],
          qualifications: data.qualifications || [],
          preferredQualifications: data.preferredQualifications || [],
        });
      }
      lastDocId = doc.id;
    });

    res.status(200).json({ jobs, lastDocId });
  } catch (error) {
    console.error('Error fetching paginated jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}
