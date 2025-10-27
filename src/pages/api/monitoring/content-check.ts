import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';

// A simple secret to prevent unauthorized access to this monitoring endpoint.
// In a real-world scenario, this should be a more robust, rotating secret stored in environment variables.
const MONITORING_SECRET = process.env.MONITORING_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // --- Authentication ---
  if (!MONITORING_SECRET) {
    console.error('MONITORING_SECRET environment variable is not set.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const { secret } = req.query;
  // Ensure both are strings before converting to Buffer
  const secretBuffer = Buffer.from(secret as string || '', 'utf8');
  const monitoringSecretBuffer = Buffer.from(MONITORING_SECRET, 'utf8');

  // Use timingSafeEqual to prevent timing attacks
  if (secretBuffer.length !== monitoringSecretBuffer.length || !crypto.timingSafeEqual(secretBuffer, monitoringSecretBuffer)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- Monitoring Logic ---
  try {
    const { adminDb } = await getFirebaseAdmin();
    const now = new Date();
    // Check for content created in the last 24 hours.
    const checkPeriod = 24 * 60 * 60 * 1000;
    const checkDate = new Date(now.getTime() - checkPeriod);

    const jobsSnapshot = await adminDb
      .collection('jobs')
      .where('postedDate', '>=', checkDate)
      .get();

    const articlesSnapshot = await adminDb
      .collection('articles')
      .where('publishDate', '>=', checkDate)
      .get();

    const newJobs = jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
    }));
    const newArticles = articlesSnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
    }));

    const hasNewContent = newJobs.length > 0 || newArticles.length > 0;

    // --- Reporting ---
    // For now, we log to the console. This can be replaced with an email/Slack notification.
    if (hasNewContent) {
      console.log(
        'MONITORING ALERT: New content detected in the last 24 hours.'
      );
      console.log('New Jobs:', newJobs);
      console.log('New Articles:', newArticles);
    } else {
      console.log(
        'MONITORING CHECK: No new content detected in the last 24 hours.'
      );
    }

    return res.status(200).json({
      message: 'Monitoring check complete.',
      newJobs,
      newArticles,
    });
  } catch (error) {
    console.error('Error during content monitoring check:', error);
    return res
      .status(500)
      .json({ message: 'An internal server error occurred.' });
  }
}
