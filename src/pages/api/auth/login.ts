import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'ID Token is required' });
  }

  try {
    // Verify the ID token to ensure it's valid.
    await adminAuth.verifyIdToken(idToken);

    // Set the ID token as an HttpOnly, secure cookie.
    res.setHeader('Set-Cookie', serialize('__session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
      sameSite: 'lax',
    }));

    return res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    // If token verification fails, Firebase Admin SDK throws an error.
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
}
