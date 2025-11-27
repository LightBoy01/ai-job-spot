// src/pages/api/analysis/github.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { DeveloperDnaReport, generateDeveloperDNA } from '@/lib/analysis/engine';
import { admin } from '@/lib/firebaseAdmin';

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeveloperDnaReport | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let uid = '';

  try {
    // 1. Verify User Authentication
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;

    // 2. Generate the report
    // In a production app, you might add caching here to avoid re-generating
    // the report on every single request.
    const report = await generateDeveloperDNA(uid);

    // 3. Return the report
    return res.status(200).json(report);

  } catch (error: unknown) {
    console.error(`Error generating GitHub analysis for UID: ${uid}`, error);
    // Provide a more specific error message if available
    const message = error instanceof Error ? error.message : 'An internal error occurred while generating the report.';
    return res.status(500).json({ error: message });
  }
}
