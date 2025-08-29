import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin'; // Import admin directly
import { adminApp } from './firebaseAdmin'; // Import adminApp from the new file

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  decodedIdToken?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to verify a Firebase ID token and check for admin custom claims.
 * Responds with 401/403 and returns false if auth fails.
 * @param req The Next.js API request object.
 * @param res The Next.js API response object.
 * @returns {Promise<boolean>} True if the user is an authenticated admin, false otherwise.
 */
export async function requireAdmin(req: AuthenticatedNextApiRequest, res: NextApiResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    res.json({ error: 'Unauthorized: No token provided' });
    res.end();
    return false;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Use adminApp.auth() for token verification
    const decodedToken = await adminApp.auth().verifyIdToken(idToken);
    
    if (decodedToken.admin !== true) {
      res.statusCode = 403;
      res.json({ error: 'Forbidden: User is not an admin' });
      res.end();
      return false;
    }

    req.decodedIdToken = decodedToken;
    return true;
  } catch (e) {
    console.error('Middleware: Error verifying ID token:', e);
    res.statusCode = 401;
    res.json({ error: 'Unauthorized: Invalid token' });
    res.end();
    return false;
  }
}