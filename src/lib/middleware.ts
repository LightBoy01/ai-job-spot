import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { parse } from 'cookie';

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  decodedIdToken?: DecodedIdToken;
}

/**
 * Middleware to verify a Firebase session cookie and optionally check for admin custom claims.
 * Responds with 401/403 and returns false if auth fails.
 * @param req The Next.js API request object.
 * @param res The Next.js API response object.
 * @param requireAdminRole Whether to strictly require the admin claim. Defaults to true for backward compatibility.
 * @returns {Promise<boolean>} True if the user is authenticated (and is admin if required), false otherwise.
 */
export async function requireAuth(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
  requireAdminRole: boolean = true
): Promise<boolean> {
  const { adminAuth } = await getFirebaseAdmin();
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies.__session || '';

  if (!sessionCookie) {
    if (req.url?.startsWith('/api/')) {
        res.status(401).json({ error: 'Unauthorized: No session cookie provided' });
    } else {
        // Redirect to public login for general pages, admin login for admin pages
        const redirectUrl = req.url?.startsWith('/admin') ? '/admin/login' : '/login';
        res.writeHead(302, { Location: redirectUrl });
        res.end();
    }
    return false;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (requireAdminRole && decodedToken.admin !== true) {
      if (req.url?.startsWith('/api/')) {
          res.status(403).json({ error: 'Forbidden: User is not an admin' });
      } else {
          res.writeHead(302, { Location: '/' }); 
          res.end();
      }
      return false;
    }

    req.decodedIdToken = decodedToken;
    return true;
  } catch (e) {
    if (req.url?.startsWith('/api/')) {
        res.status(401).json({ error: 'Unauthorized: Invalid session cookie' });
    } else {
        const redirectUrl = req.url?.startsWith('/admin') ? '/admin/login' : '/login';
        res.writeHead(302, { Location: redirectUrl });
        res.end();
    }
    return false;
  }
}

/**
 * Legacy wrapper for backward compatibility.
 */
export async function requireAdmin(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  return requireAuth(req, res, true);
}
