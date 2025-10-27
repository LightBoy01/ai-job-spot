import type { NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting } from '@/lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { safeToTimestamp } from '@/lib/apiUtils';
import DOMPurify from 'isomorphic-dompurify';
import { JobFormData, JobPostingSchema } from '@/lib/validationSchemas';
import logger from '@/data-pipeline/utils/logger'; // Import the logger

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Unauthorized attempt to access job API.');
    return;
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id }, 'Invalid job ID provided to job API.');
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const jobData: JobFormData = req.body;

      // We can reuse the same Zod schema for validation
      const validationResult = JobPostingSchema.safeParse(jobData);
      if (!validationResult.success) {
        logger.warn({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id, errors: validationResult.error.flatten().fieldErrors }, 'Job update validation failed.');
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

      logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id }, 'Job updated successfully.');
      return res
        .status(200)
        .json({ message: 'Job updated successfully!', job: finalJob });
    } catch (error) {
      logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id, error: error instanceof Error ? error.message : String(error) }, 'Error updating job.');
      return res
        .status(500)
        .json({ error: 'An internal server error occurred.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { adminDb } = await getFirebaseAdmin();
      await adminDb.collection('jobs').doc(id).delete();

      // Revalidate paths to reflect the deletion
      await res.revalidate('/');
      await res.revalidate('/jobs');

      logger.info({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id }, 'Job deleted successfully.');
      return res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
      logger.error({ uid: req.decodedIdToken?.uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: id, error: error instanceof Error ? error.message : String(error) }, 'Error deleting job.');
      return res
        .status(500)
        .json({ error: 'An internal server error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
