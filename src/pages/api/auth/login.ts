import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { idToken } = req.body;

  if (!idToken) {
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
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn / 1000, // maxAge is in seconds
        path: '/',
        sameSite: 'lax',
      })
    );

    return res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    // If token verification fails, createSessionCookie throws an error.
    console.error('Authentication error:', error);
    return res
      .status(401)
      .json({ message: 'Authentication failed. Invalid token.' });
  }
}
