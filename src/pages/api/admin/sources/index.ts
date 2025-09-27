import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Source } from '@/lib/types';
import { validateCsrfToken } from '../../csrf';
import { z } from 'zod';

// Zod schema for creating a source
const SourceCreateSchema = z.object({
  sourceName: z.string().min(1, 'Source name cannot be empty.'),
  feedUrl: z.string().url('Invalid URL format.'),
  type: z.enum(['Job', 'Article']),
  adapter: z.string().min(1),
  status: z.enum(['Pending', 'Integrated', 'Failing']),
  keywords: z.string().optional(),
});

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
    const validationResult = SourceCreateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid data provided.',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const newSourceData = validationResult.data;

    const docRef = await adminDb.collection('sources').add(newSourceData);
    res.status(201).json({ id: docRef.id, ...newSourceData });
  } catch (error) {
    console.error('Error creating source:', error);
    res.status(500).json({ message: 'Error creating source' });
  }
}
