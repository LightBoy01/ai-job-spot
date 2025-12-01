// src/pages/api/integrations/github/connect.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { encrypt } from '@/lib/encryption';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { isErrorWithMessage } from '@/lib/utils';

interface ConnectRequestBody {
  token?: string;
}

type Data = {
  message: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verify User Authentication
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const { adminAuth } = await getFirebaseAdmin();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // 2. Get the GitHub token from the request body
    const { token: githubToken } = req.body as ConnectRequestBody;
    if (!githubToken || typeof githubToken !== 'string') {
      return res
        .status(400)
        .json({ error: 'Bad Request: Missing or invalid GitHub token' });
    }

    // 3. Encrypt the Token
    const encryptedToken = encrypt(githubToken);

    // 4. Store in Firestore
    const { adminDb: db } = await getFirebaseAdmin();
    const integrationRef = db.collection('userIntegrations').doc(uid);

    // We use set with merge:true to avoid overwriting other potential integrations
    await integrationRef.set(
      {
        github: {
          accessToken: encryptedToken,
          connectedAt: new Date().toISOString(),
          // We can add more metadata here later, like the GitHub username
        },
      },
      { merge: true }
    );

    // 5. Return a success response
    return res.status(200).json({ message: 'GitHub integration successful.' });
  } catch (error: unknown) {
    console.error('Error in GitHub connect API:', error);
    if (
      isErrorWithMessage(error) &&
      'code' in error &&
      (error as { code: unknown }).code === 'auth/id-token-expired'
    ) {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}