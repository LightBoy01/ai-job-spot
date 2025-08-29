import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

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
    // Set the ID token as an HttpOnly cookie
    res.setHeader('Set-Cookie', serialize('__session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
      sameSite: 'lax', // Or 'strict' for more security
    }));

    return res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error setting session cookie:', error);
    return res.status(500).json({ message: 'Failed to set session cookie' });
  }
}
