import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Source } from '@/lib/types';
import { z } from 'zod';

import { validateCsrfToken } from '../../csrf';

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === 'PUT' || req.method === 'DELETE') {
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ message: 'Source ID is required' });
    return;
  }

  switch (req.method) {
    case 'GET':
      await getSourceById(req, res, id);
      break;
    case 'PUT':
      await updateSource(req, res, id);
      break;
    case 'DELETE':
      await deleteSource(req, res, id);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getSourceById(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const doc = await adminDb.collection('sources').doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ message: 'Source not found' });
      return;
    }
    res.status(200).json({ id: doc.id, ...doc.data() } as Source);
  } catch (error) {
    console.error('Error fetching source:', error);
    res.status(500).json({ message: 'Error fetching source' });
  }
}

const SourceUpdateSchema = z.object({
  sourceName: z.string().min(1, 'Source name cannot be empty.').optional(),
  feedUrl: z.string().url('Invalid URL format.').optional(),
  type: z.enum(['Job', 'Article']).optional(),
  adapter: z.string().min(1).optional(),
  status: z.enum(['Pending', 'Integrated', 'Failing']).optional(),
  keywords: z.string().optional(),
}).partial();

async function updateSource(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const validationResult = SourceUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid data provided.',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const updatedSourceData = validationResult.data;

    if (Object.keys(updatedSourceData).length === 0) {
      return res.status(400).json({ message: 'Request body cannot be empty.' });
    }

    await adminDb.collection('sources').doc(id).update(updatedSourceData);
    res.status(200).json({ id, ...updatedSourceData });
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ message: 'Error updating source' });
  }
}

async function deleteSource(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    await adminDb.collection('sources').doc(id).delete();
    res.status(204).end(); // No content to send back
  } catch (error) {
    console.error('Error deleting source:', error);
    res.status(500).json({ message: 'Error deleting source' });
  }
}
