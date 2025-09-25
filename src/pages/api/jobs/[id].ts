import type { NextApiResponse } from 'next';
import { adminDb, admin } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { JobPostingSchema } from '@/lib/validationSchemas'; // Import Zod schema
import { marked } from 'marked'; // Import marked for HTML sanitization

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
        // Validate input with Zod schema
        const validationResult = JobPostingSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            message: 'Invalid job posting data',
            errors: validationResult.error.flatten(),
          });
        }

        const jobData = validationResult.data;

        const updateData: Partial<FirestoreJobPosting> = {};

        // Map validated data to Firestore format
        if (jobData.title !== undefined) updateData.title = jobData.title;
        if (jobData.company !== undefined) updateData.company = jobData.company;
        if (jobData.location !== undefined)
          updateData.location = jobData.location;
        if (jobData.applicationLink !== undefined)
          updateData.applicationLink = jobData.applicationLink;
        if (jobData.salaryRange !== undefined)
          updateData.salaryRange = jobData.salaryRange;
        if (jobData.jobLevel !== undefined)
          updateData.jobLevel = jobData.jobLevel;
        if (jobData.employeeRole !== undefined)
          updateData.employeeRole = jobData.employeeRole;
        if (jobData.status !== undefined) updateData.status = jobData.status;
        if (jobData.isNew !== undefined) updateData.isNew = jobData.isNew;
        if (jobData.source !== undefined) updateData.source = jobData.source;
        if (jobData.sourceUrl !== undefined)
          updateData.sourceUrl = jobData.sourceUrl;
        if (jobData.glassdoorLink !== undefined)
          updateData.glassdoorLink = jobData.glassdoorLink;
        if (jobData.crunchbaseLink !== undefined)
          updateData.crunchbaseLink = jobData.crunchbaseLink;
        if (jobData.story_question1 !== undefined)
          updateData.story_question1 = jobData.story_question1;
        if (jobData.story_answer1 !== undefined)
          updateData.story_answer1 = jobData.story_answer1;
        if (jobData.story_question2 !== undefined)
          updateData.story_question2 = jobData.story_question2;
        if (jobData.story_answer2 !== undefined)
          updateData.story_answer2 = jobData.story_answer2;
        if (jobData.story_question3 !== undefined)
          updateData.story_question3 = jobData.story_question3;
        if (jobData.story_answer3 !== undefined)
          updateData.story_answer3 = jobData.story_answer3;
        if (jobData.companyCulture !== undefined)
          updateData.companyCulture = jobData.companyCulture;
        if (jobData.applicationExperience !== undefined)
          updateData.applicationExperience = jobData.applicationExperience;
        if (jobData.companyLogoUrl !== undefined)
          updateData.companyLogoUrl = jobData.companyLogoUrl;

        // HTML Sanitization for description
        if (jobData.description !== undefined) {
          updateData.description = DOMPurify.sanitize(
            await marked(jobData.description)
          );
        }

        // Convert string arrays
        if (jobData.responsibilities !== undefined)
          updateData.responsibilities = jobData.responsibilities
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s);
        if (jobData.qualifications !== undefined)
          updateData.qualifications = jobData.qualifications
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s);
        if (jobData.preferredQualifications !== undefined)
          updateData.preferredQualifications = jobData.preferredQualifications
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s);
        if (jobData.tags !== undefined)
          updateData.tags = jobData.tags
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s);

        // Convert dates to Firestore Timestamps
        if (jobData.postedDate !== undefined)
          updateData.postedDate = admin.firestore.Timestamp.fromDate(
            new Date(jobData.postedDate)
          );
        if (jobData.expirationDate !== undefined)
          updateData.expirationDate = jobData.expirationDate
            ? admin.firestore.Timestamp.fromDate(
                new Date(jobData.expirationDate)
              )
            : null;
        if (jobData.verificationDate !== undefined)
          updateData.verificationDate = jobData.verificationDate
            ? admin.firestore.Timestamp.fromDate(
                new Date(jobData.verificationDate)
              )
            : null;

        if (Object.keys(updateData).length === 0) {
          return res
            .status(400)
            .json({ error: 'No valid fields provided for update.' });
        }

        await jobRef.update(updateData);

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/');
          await res.revalidate(`/jobs/${id}`);
        } catch (revalError) {
          console.error(
            'Error during revalidation after job update:',
            revalError
          );
        }

        const updatedDoc = await jobRef.get();
        const updatedJobData = updatedDoc.data() as FirestoreJobPosting;

        const finalJob = {
          id: updatedDoc.id,
          ...updatedJobData,
          // Convert Timestamps to ISO strings for JSON serialization
          postedDate: updatedJobData.postedDate.toDate().toISOString(),
          expirationDate: updatedJobData.expirationDate
            ? updatedJobData.expirationDate.toDate().toISOString()
            : null,
        };

        res
          .status(200)
          .json({ message: 'Job posting updated successfully', job: finalJob });
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
          console.error(
            'Error during revalidation after job deletion:',
            revalError
          );
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
