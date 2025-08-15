
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
import { JobPosting } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  // Use adminDb for server-side operations that bypass security rules
  const jobRef = adminDb.collection('jobs').doc(id);

  switch (req.method) {
    case 'PUT':
      try {
        const jobData: Partial<JobPosting> = req.body;

        // Basic validation
        if (Object.keys(jobData).length === 0) {
          return res.status(400).json({ error: 'Request body cannot be empty' });
        }

        const sanitizedDescription = jobData.description
          ? purify.sanitize(jobData.description)
          : undefined;

        await jobRef.update({
          ...jobData,
          ...(sanitizedDescription && { description: sanitizedDescription }),
        });

        res.status(200).json({ message: 'Job posting updated successfully' });
      } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).json({ error: 'Failed to update job posting' });
      }
      break;

    case 'DELETE':
      try {
        await jobRef.delete();
        res.status(200).json({ message: 'Job posting deleted successfully' });
      } catch (error) {
        console.error('Error deleting document: ', error);
        res.status(500).json({ error: 'Failed to delete job posting' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
