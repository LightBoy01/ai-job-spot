import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import { JobPosting, FirestoreJobPosting } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// This type represents the shape of the data coming from the frontend form
type JobFormData = Partial<Omit<JobPosting, 'id' | 'tags' | 'responsibilities' | 'qualifications'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
}>;

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

  const jobRef = adminDb.collection('jobs').doc(id);

  switch (req.method) {
    case 'PUT':
      try {
        const jobData: JobFormData = req.body;

        // --- Comprehensive Server-Side Validation ---
        const errors: Record<string, string> = {};
        // Note: In a PUT, we only validate fields that are present in the request body.
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

        const updateData: Partial<FirestoreJobPosting> = {};

        // --- Data Sanitization & Transformation ---
        for (const key in jobData) {
            if (Object.prototype.hasOwnProperty.call(jobData, key)) {
                const value = jobData[key as keyof JobFormData];

                if (key === 'postedDate' && typeof value === 'string') {
                    updateData.postedDate = admin.firestore.Timestamp.fromDate(new Date(value));
                } else if (key === 'expirationDate' && typeof value === 'string') {
                    updateData.expirationDate = admin.firestore.Timestamp.fromDate(new Date(value));
                } else if (key === 'description' && typeof value === 'string') {
                    updateData.description = purify.sanitize(value);
                } else if (key === 'tags' && typeof value === 'string') {
                    updateData.tags = value.split(',').map(tag => tag.trim());
                } else if (key === 'responsibilities' && typeof value === 'string') {
                    updateData.responsibilities = value.split('\n').map(r => r.trim());
                } else if (key === 'qualifications' && typeof value === 'string') {
                    updateData.qualifications = value.split('\n').map(q => q.trim());
                } else if (value !== undefined) {
                    (updateData as Record<string, unknown>)[key] = value;
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No fields to update.' });
        }

        await jobRef.update(updateData);

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/'); // Revalidate home page
          await res.revalidate(`/jobs/${id}`); // Revalidate specific job page
        } catch (revalError) {
          console.error('Error during revalidation after job update:', revalError);
        }

        res.status(200).json({ message: 'Job posting updated successfully' });
      } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).json({ error: 'Failed to update job posting' });
      }
      break;

    case 'DELETE':
      try {
        await jobRef.delete();

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/'); // Revalidate home page
          await res.revalidate(`/jobs/${id}`); // Revalidate specific job page
        } catch (revalError) {
          console.error('Error during revalidation after job deletion:', revalError);
        }

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