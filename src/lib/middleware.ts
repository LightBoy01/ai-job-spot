import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from './firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { parse } from 'cookie';

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  decodedIdToken?: DecodedIdToken;
}

/**
 * Middleware to verify a Firebase session cookie and check for admin custom claims.
 * Responds with 401/403 and returns false if auth fails.
 * @param req The Next.js API request object.
 * @param res The Next.js API response object.
 * @returns {Promise<boolean>} True if the user is an authenticated admin, false otherwise.
 */
export async function requireAdmin(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  const { adminAuth } = await getFirebaseAdmin();
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies.__session || '';

  if (!sessionCookie) {
    res.status(401).json({ error: 'Unauthorized: No session cookie provided' });
    return false;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (decodedToken.admin !== true) {
      res.status(403).json({ error: 'Forbidden: User is not an admin' });
      return false;
    }

    req.decodedIdToken = decodedToken;
    return true;
  } catch (e) {
    console.error('Middleware: Error verifying session cookie:', e);
    res.status(401).json({ error: 'Unauthorized: Invalid session cookie' });
    return false;
  }
}
