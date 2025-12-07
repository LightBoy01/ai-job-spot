import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/data-pipeline/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too Many Requests' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const { adminAuth, adminDb } = await getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
        // It's normal for a new user to not have a doc yet if they haven't verified anything.
        // Return nulls instead of 404 to make frontend handling easier.
        return res.status(200).json({ verifiedClaims: null, developerDNA: null });
    }

    const userData = userDoc.data();
    
    const profile = {
        verifiedClaims: userData?.verifiedClaims || null,
        developerDNA: userData?.developerDNA || null,
        isPublic: userData?.isPublic || false,
    };

    return res.status(200).json(profile);

  } catch (error) {
    logger.error({ error: String(error) }, 'Error fetching user profile');
    return res.status(401).json({ message: 'Invalid token or server error.' });
  }
}
