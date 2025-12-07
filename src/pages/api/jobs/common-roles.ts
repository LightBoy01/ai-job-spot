import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';

const METADATA_COLLECTION = 'metadata';
const COMMON_ROLES_DOC = 'common_roles';

/**
 * An API endpoint to get the most common job roles from a pre-aggregated
 * document in Firestore.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ roles: { key: string; title: string }[] } | { message: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // This data is pre-aggregated and changes infrequently.
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400' // 1 hour cache, 1 day stale
  );

  try {
    const { adminDb } = await getFirebaseAdmin();
    const docRef = adminDb.collection(METADATA_COLLECTION).doc(COMMON_ROLES_DOC);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return res.status(404).json({ message: 'Common roles data not found. Please run the aggregation script.' });
    }

    const data = docSnap.data();
    const roles = data?.roles || [];

    return res.status(200).json({ roles });
  } catch (error) {
    console.error('Error fetching common roles:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
