import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting } from '@/lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { safeToTimestamp } from '@/lib/apiUtils';
import DOMPurify from 'isomorphic-dompurify';
import { JobFormData, JobPostingSchema } from '@/lib/validationSchemas';

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

  if (req.method === 'PUT') {
    try {
      const jobData: JobFormData = req.body;

      // We can reuse the same Zod schema for validation
      const validationResult = JobPostingSchema.safeParse(jobData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        });
      }

      const sanitizedDescription = DOMPurify.sanitize(
        jobData.description || ''
      );
      const jobRef = adminDb.collection('jobs').doc(id);

      const postedTimestamp = safeToTimestamp(jobData.postedDate, 'now')!;
      const expirationTimestamp = safeToTimestamp(
        jobData.expirationDate,
        'null'
      );
      const verificationTimestamp = safeToTimestamp(
        jobData.verificationDate,
        'null'
      );

      const responsibilitiesArray = jobData.responsibilities
        ? jobData.responsibilities.split('\n').filter((r) => r.trim() !== '')
        : [];
      const qualificationsArray = jobData.qualifications
        ? jobData.qualifications.split('\n').filter((q) => q.trim() !== '')
        : [];
      const preferredQualificationsArray = jobData.preferredQualifications
        ? jobData.preferredQualifications.split('\n').filter((q) => q.trim() !== '')
        : [];

      const updatedJobData: Partial<FirestoreJobPosting> = {
        ...jobData,
        description: sanitizedDescription,
        postedDate: postedTimestamp,
        expirationDate: expirationTimestamp,
        verificationDate: verificationTimestamp,
        tags: jobData.tags
          ? jobData.tags.split(',').map((tag) => tag.trim())
          : [],
        responsibilities: responsibilitiesArray,
        qualifications: qualificationsArray,
        preferredQualifications: preferredQualificationsArray,
      };

      await jobRef.update(updatedJobData);

      // Revalidate paths to show updated content
      await res.revalidate('/');
      await res.revalidate(`/jobs/${id}`);

      const finalJob = { ...updatedJobData, id };

      return res
        .status(200)
        .json({ message: 'Job updated successfully!', job: finalJob });
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      return res
        .status(500)
        .json({ error: 'An internal server error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
