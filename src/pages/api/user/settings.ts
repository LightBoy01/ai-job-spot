import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/data-pipeline/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
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
  const { isPublic } = req.body;

  if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: 'Invalid payload' });
  }

  try {
    const { adminAuth, adminDb } = await getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await adminDb.collection('users').doc(userId).set({
        isPublic: isPublic,
        updatedAt: new Date()
    }, { merge: true });

    logger.info({ userId, isPublic }, 'User updated profile visibility');

    return res.status(200).json({ message: 'Settings updated' });

  } catch (error) {
    logger.error({ error: String(error) }, 'Error updating user settings');
    return res.status(500).json({ message: 'Server error' });
  }
}
