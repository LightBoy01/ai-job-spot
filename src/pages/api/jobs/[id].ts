import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin';
import { FirestoreJobPosting, JobPosting } from '../../../lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';
import { validatePayload, isRequired, isURL, safeToTimestamp, isAfter } from '../../../lib/apiUtils';

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

        const errors = validatePayload(jobData, {
            title: [isRequired('Job Title')],
            company: [isRequired('Company')],
            location: [isRequired('Location')],
            description: [isRequired('Job Description')],
            applicationLink: [isRequired('Application Link'), isURL('Application Link')],
            expirationDate: [isAfter('postedDate', 'Posted Date')],
        });

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({ message: 'Validation failed', details: errors });
        }

        const updateData: Partial<FirestoreJobPosting> = {};

        // Build the update object safely, only including fields that were passed
        if (jobData.title) updateData.title = jobData.title;
        if (jobData.company) updateData.company = jobData.company;
        if (jobData.location) updateData.location = jobData.location;
        if (jobData.description) updateData.description = DOMPurify.sanitize(jobData.description);
        if (jobData.applicationLink) updateData.applicationLink = jobData.applicationLink;
        if (jobData.salaryRange) updateData.salaryRange = jobData.salaryRange;
        if (jobData.tags) updateData.tags = jobData.tags.split(',').map(tag => tag.trim());
        if (jobData.status) updateData.status = jobData.status;
        if (jobData.jobLevel) updateData.jobLevel = jobData.jobLevel;
        if (jobData.employeeRole) updateData.employeeRole = jobData.employeeRole;
        if (jobData.responsibilities) updateData.responsibilities = jobData.responsibilities.split('\n').filter(r => r.trim() !== '');
        if (jobData.qualifications) updateData.qualifications = jobData.qualifications.split('\n').filter(q => q.trim() !== '');

        if (jobData.postedDate) {
            const timestamp = safeToTimestamp(jobData.postedDate, 'now');
            if (timestamp) {
                updateData.postedDate = timestamp;
            }
        }
        if (jobData.expirationDate) {
            const timestamp = safeToTimestamp(jobData.expirationDate, 'null');
            if (timestamp) {
                updateData.expirationDate = timestamp;
            }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        await jobRef.update(updateData);

        // Fetch the updated document to return it
        const updatedDoc = await jobRef.get();
        if (!updatedDoc.exists) {
          return res.status(404).json({ error: 'Job not found after update.' });
        }

        const updatedJobData = updatedDoc.data() as FirestoreJobPosting;

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/');
          await res.revalidate(`/jobs/${id}`);
        } catch (revalError) {
          console.error('Error during revalidation after job update:', revalError);
        }

        const finalJob = {
          id: updatedDoc.id,
          ...updatedJobData,
          // Convert Timestamps to ISO strings for JSON serialization
          postedDate: updatedJobData.postedDate.toDate().toISOString(),
          expirationDate: updatedJobData.expirationDate ? updatedJobData.expirationDate.toDate().toISOString() : null,
        };

        res.status(200).json({ message: 'Job posting updated successfully', job: finalJob });
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