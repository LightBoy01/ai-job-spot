import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import * as admin from 'firebase-admin';

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobsRef = adminDb.collection('jobs');

    // Calculate date for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);

    // Fetch all jobs to calculate stats (consider pagination for very large datasets in future)
    const snapshot = await jobsRef.get();
    const allJobs = snapshot.docs.map(doc => doc.data());

    let publishedJobs = 0;
    let pendingReviews = 0;
    let rejectedJobs = 0;
    let weeklySubmissions = 0;

    allJobs.forEach(job => {
      if (job.status === 'published') {
        publishedJobs++;
      } else if (job.status === 'pending_review') {
        pendingReviews++;
      } else if (job.status === 'rejected') {
        rejectedJobs++;
      }

      // Check for weekly submissions based on postedDate
      if (job.postedDate && job.postedDate instanceof admin.firestore.Timestamp && job.postedDate.toMillis() >= sevenDaysAgoTimestamp.toMillis()) {
        weeklySubmissions++;
      }
    });

    const totalReviewed = publishedJobs + rejectedJobs;
    const approvalRate = totalReviewed > 0 ? (publishedJobs / totalReviewed) * 100 : 0;
    const rejectionRate = totalReviewed > 0 ? (rejectedJobs / totalReviewed) * 100 : 0;

    return res.status(200).json({
      totalPublishedJobs: publishedJobs,
      totalPendingReviews: pendingReviews,
      totalRejectedJobs: rejectedJobs,
      weeklySubmissions: weeklySubmissions,
      approvalRate: approvalRate.toFixed(2), // Format to 2 decimal places
      rejectionRate: rejectionRate.toFixed(2), // Format to 2 decimal places
    });

  } catch (error) {
    console.error('Error fetching job stats:', error);
    return res.status(500).json({ error: 'Failed to fetch job statistics.' });
  }
}
