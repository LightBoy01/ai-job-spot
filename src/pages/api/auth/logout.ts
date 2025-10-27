import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import logger from '@/data-pipeline/utils/logger'; // Import the logger

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const sessionCookie = req.cookies.__session || '';

  if (!sessionCookie) {
    // No session cookie, so nothing to log out from.
    logger.info({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Logout attempt with no active session.');
    return res.status(200).json({ message: 'Already logged out' });
  }

  try {
    const { adminAuth } = await getFirebaseAdmin();

    // Verify the session cookie to get the UID
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Revoke all refresh tokens for the user to invalidate all sessions
    await adminAuth.revokeRefreshTokens(decodedClaims.uid);

    // Clear the session cookie by setting an expired one
    res.setHeader(
      'Set-Cookie',
      serialize('__session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0, // Expire immediately
        path: '/',
        sameSite: 'lax',
      })
    );

    logger.info({ uid: decodedClaims.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'User logged out successfully.');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.warn({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: error instanceof Error ? error.message : String(error) }, 'Logout error: session invalidation failed.');
    // Even if there's an error (e.g., invalid session cookie), still clear the client-side cookie
    res.setHeader(
      'Set-Cookie',
      serialize('__session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
      })
    );
    return res.status(200).json({ message: 'Logged out successfully (session invalidation attempted)' });
  }
}
