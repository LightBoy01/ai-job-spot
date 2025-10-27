import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Source } from '@/lib/types';
import { z } from 'zod';
import logger from '@/data-pipeline/utils/logger'; // Import the logger

import { validateCsrfToken } from '../../csrf';

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: req.query.id }, 'Unauthorized attempt to access source API.');
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
      logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: req.query.id, error: message }, 'CSRF token validation failed for source API.');
      return res.status(403).json({ message });
    }
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Invalid source ID provided to source API.');
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
    const { adminDb } = await getFirebaseAdmin();
    const doc = await adminDb.collection('sources').doc(id).get();
    if (!doc.exists) {
      logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id }, 'Source not found.');
      res.status(404).json({ message: 'Source not found' });
      return;
    }
    logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id }, 'Source fetched successfully.');
    res.status(200).json({ id: doc.id, ...doc.data() } as Source);
  } catch (error) {
    logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id, error: error instanceof Error ? error.message : String(error) }, 'Error fetching source.');
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
    const { adminDb } = await getFirebaseAdmin();
    const validationResult = SourceUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id, errors: validationResult.error.flatten().fieldErrors }, 'Source update validation failed.');
      return res.status(400).json({ 
        message: 'Invalid data provided.',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const updatedSourceData = validationResult.data;

    if (Object.keys(updatedSourceData).length === 0) {
      logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id }, 'Source update attempt with empty body.');
      return res.status(400).json({ message: 'Request body cannot be empty.' });
    }

    await adminDb.collection('sources').doc(id).update(updatedSourceData);
    logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id }, 'Source updated successfully.');
    res.status(200).json({ id, ...updatedSourceData });
  } catch (error) {
    logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id, error: error instanceof Error ? error.message : String(error) }, 'Error updating source.');
    res.status(500).json({ message: 'Error updating source' });
  }
}

async function deleteSource(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
  id: string
) {
  try {
    const { adminDb } = await getFirebaseAdmin();
    await adminDb.collection('sources').doc(id).delete();
    logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id }, 'Source deleted successfully.');
    res.status(204).end(); // No content to send back
  } catch (error) {
    logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: id, error: error instanceof Error ? error.message : String(error) }, 'Error deleting source.');
    res.status(500).json({ message: 'Error deleting source' });
  }
}
