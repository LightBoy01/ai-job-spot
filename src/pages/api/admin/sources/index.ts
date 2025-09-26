import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Source } from '@/lib/types';
import { validateCsrfToken } from '../../csrf';

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === 'POST') {
    try {
      await validateCsrfToken(req);
    } catch (error) {
      let message = 'Invalid CSRF token.';
      if (error instanceof Error) {
          message = error.message;
      }
      return res.status(403).json({ message });
    }
  }

  switch (req.method) {
    case 'GET':
      await getSources(req, res);
      break;
    case 'POST':
      await createSource(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getSources(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  try {
    const sourcesSnapshot = await adminDb.collection('sources').get();
    const sources = sourcesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];
    res.status(200).json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ message: 'Error fetching sources' });
  }
}

async function createSource(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  try {
    const newSourceData: Omit<Source, 'id'> = req.body;
    // Basic validation
    if (!newSourceData.sourceName || !newSourceData.feedUrl || !newSourceData.type || !newSourceData.adapter) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const docRef = await adminDb.collection('sources').add(newSourceData);
    res.status(201).json({ id: docRef.id, ...newSourceData });
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({ message: 'Error creating source' });
  }
}
