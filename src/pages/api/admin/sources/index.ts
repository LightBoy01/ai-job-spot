import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { Source } from '@/lib/types';
import { validateCsrfToken } from '../../csrf';
import { z } from 'zod';
import logger from '@/data-pipeline/utils/logger'; // Import the logger

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
    logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Unauthorized attempt to access sources API.');
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
      logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: message }, 'CSRF token validation failed for source creation.');
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
    const { adminDb } = await getFirebaseAdmin();
    const sourcesSnapshot = await adminDb.collection('sources').get();
    const sources = sourcesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Source[];
    logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Sources fetched successfully.');
    res.status(200).json(sources);
  } catch (error) {
    logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: error instanceof Error ? error.message : String(error) }, 'Error fetching sources.');
    res.status(500).json({ message: 'Error fetching sources' });
  }
}

async function createSource(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const validationResult = SourceCreateSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, errors: validationResult.error.flatten().fieldErrors }, 'Source creation validation failed.');
      return res.status(400).json({ 
        message: 'Invalid data provided.',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const newSourceData = validationResult.data;

    const docRef = await adminDb.collection('sources').add(newSourceData);
    logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, sourceId: docRef.id }, 'Source created successfully.');
    res.status(201).json({ id: docRef.id, ...newSourceData });
  } catch (error) {
    logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: error instanceof Error ? error.message : String(error) }, 'Error creating source.');
    res.status(500).json({ message: 'Error creating source' });
  }
}
