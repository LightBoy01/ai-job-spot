import { serialize, parse } from 'cookie';
import { randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

// This function is exported for use in other API routes if needed, but the main logic is here.
export function setCsrfTokenCookie(res: NextApiResponse) {
  const token = randomBytes(32).toString('hex');
  const cookie = serialize(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
  });
  res.setHeader('Set-Cookie', cookie);
  return token;
}

// This is the validation middleware function we will import into our protected API routes.
export function validateCsrfToken(req: NextApiRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const tokenFromHeader = req.headers[CSRF_HEADER_NAME] as string;
    const cookies = parse(req.headers.cookie || '');
    const tokenFromCookie = cookies[CSRF_COOKIE_NAME];

    if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
      const error = new Error('Invalid CSRF token.');
      return reject(error);
    }

    resolve();
  });
}

// This default handler exposes a GET endpoint for the frontend to fetch a fresh token.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const token = setCsrfTokenCookie(res);
      res.status(200).json({ csrfToken: token });
    } catch {
        res.status(500).json({ message: 'Failed to generate CSRF token.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
