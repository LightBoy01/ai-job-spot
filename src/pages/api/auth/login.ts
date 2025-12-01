import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { rateLimit } from '@/lib/rateLimit'; // Import the rateLimit function
import logger from '@/data-pipeline/utils/logger'; // Import the logger

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Apply rate limiting
  if (!rateLimit(req)) {
    logger.warn({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Rate limit exceeded for login attempt.');
    return res.status(429).json({ message: 'Too Many Requests' });
  }

  const { idToken } = req.body;

  if (!idToken) {
    logger.warn({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Login attempt without ID Token.');
    return res.status(400).json({ message: 'ID Token is required' });
  }

  try {
    const { adminAuth } = await getFirebaseAdmin();
    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // Create the session cookie. This will also verify the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the session cookie as an HttpOnly, secure cookie.
    res.setHeader(
      'Set-Cookie',
      serialize('__session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && !req.headers.host?.includes('localhost') && !req.headers.host?.includes('10.50'), // Disable secure for local network testing if needed
        maxAge: expiresIn / 1000, // maxAge is in seconds
        path: '/',
        sameSite: 'lax',
      })
    );

    logger.info({ uid: (await adminAuth.verifySessionCookie(sessionCookie)).uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'User logged in successfully.');
    return res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    // If token verification fails, createSessionCookie throws an error.
    logger.warn({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: error instanceof Error ? error.message : String(error) }, 'Authentication failed for login attempt.');
    return res
      .status(401)
      .json({ message: 'Authentication failed. Invalid token.' });
  }
}
