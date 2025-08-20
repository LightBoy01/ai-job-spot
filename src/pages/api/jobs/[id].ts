
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
import * as admin from 'firebase-admin';
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

        // --- Comprehensive Server-Side Validation ---
        const errors: Record<string, string> = {};
        if (jobData.title !== undefined && (typeof jobData.title !== 'string' || !jobData.title)) {
          errors.title = 'Job Title must be a non-empty string.';
        }
        if (jobData.company !== undefined && (typeof jobData.company !== 'string' || !jobData.company)) {
          errors.company = 'Company must be a non-empty string.';
        }
        if (jobData.location !== undefined && (typeof jobData.location !== 'string' || !jobData.location)) {
          errors.location = 'Location must be a non-empty string.';
        }
        if (jobData.description !== undefined && (typeof jobData.description !== 'string' || jobData.description === '<p><br></p>')) {
          errors.description = 'Job Description is required.';
        }
        if (jobData.applicationLink !== undefined) {
          if (!jobData.applicationLink) {
            errors.applicationLink = 'Application Link is required.';
          } else if (!/^https?:\/\/.+/.test(jobData.applicationLink)) {
            errors.applicationLink = 'Please enter a valid URL for the Application Link.';
          }
        }
        if (jobData.postedDate && jobData.expirationDate) {
          if (new Date(jobData.expirationDate) <= new Date(jobData.postedDate)) {
            errors.expirationDate = 'Expiration Date must be after Posted Date.';
          }
        }

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        // --- End Validation ---

        const updateData = { ...jobData };

        if (updateData.description) {
          updateData.description = purify.sanitize(updateData.description);
        }
        if (updateData.postedDate) {
          updateData.postedDate = admin.firestore.Timestamp.fromDate(new Date(updateData.postedDate));
        }
        if (updateData.expirationDate) {
          updateData.expirationDate = admin.firestore.Timestamp.fromDate(new Date(updateData.expirationDate));
        }
        if (typeof updateData.tags === 'string') {
          updateData.tags = updateData.tags.split(',').map((tag: string) => tag.trim());
        }

        await jobRef.update(updateData);

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
