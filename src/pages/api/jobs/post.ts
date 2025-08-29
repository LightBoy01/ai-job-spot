import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting, JobPosting } from '@/lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { validatePayload, isRequired, isURL, safeToTimestamp, isAfter } from '@/lib/apiUtils';
import DOMPurify from 'isomorphic-dompurify';

// This type represents the shape of the data coming from the frontend form
type JobFormData = Partial<Omit<JobPosting, 'id' | 'tags' | 'responsibilities' | 'qualifications'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
}>;

const validationSchema = {
  title: [isRequired('Job Title')],
  company: [isRequired('Company')],
  location: [isRequired('Location')],
  description: [isRequired('Job Description')],
  applicationLink: [isRequired('Application Link'), isURL('Application Link')],
  postedDate: [isRequired('Posted Date')],
  expirationDate: [isAfter('postedDate', 'Posted Date')],
};

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const jobData: JobFormData = req.body;

    const errors = validatePayload(jobData, validationSchema);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', details: errors });
    }

    const sanitizedDescription = DOMPurify.sanitize(jobData.description || '');
    const newJobRef = adminDb.collection('jobs').doc();

    const postedTimestamp = safeToTimestamp(jobData.postedDate, 'now')!;
    let expirationTimestamp = safeToTimestamp(jobData.expirationDate, 'null');

    if (!expirationTimestamp) {
        const thirtyDaysFromNow = new Date(postedTimestamp.toDate().getTime() + 30 * 24 * 60 * 60 * 1000);
        expirationTimestamp = safeToTimestamp(thirtyDaysFromNow, 'now');
    }

    const newJob: Omit<FirestoreJobPosting, 'id'> = {
      title: jobData.title!,
      company: jobData.company!,
      location: jobData.location!,
      description: sanitizedDescription,
      applicationLink: jobData.applicationLink!,
      postedDate: postedTimestamp,
      expirationDate: expirationTimestamp!,
      salaryRange: jobData.salaryRange || null,
      tags: jobData.tags ? jobData.tags.split(',').map((tag: string) => tag.trim()) : [],
      status: jobData.status || 'published',
      jobLevel: jobData.jobLevel || null,
      employeeRole: jobData.employeeRole || null,
      responsibilities: jobData.responsibilities ? jobData.responsibilities.split('\n').filter(r => r.trim() !== '') : [],
      qualifications: jobData.qualifications ? jobData.qualifications.split('\n').filter(q => q.trim() !== '') : [],
    };

    await newJobRef.set(newJob);

    console.log(`New job posted with ID: ${newJobRef.id}`);

    try {
      await res.revalidate('/');
      await res.revalidate(`/jobs/${newJobRef.id}`);
    } catch (revalError) {
      console.error('Error during revalidation:', revalError);
    }
    
    const finalJob = {
      id: newJobRef.id,
      ...newJob,
      // Convert Timestamps to ISO strings for JSON serialization
      postedDate: newJob.postedDate.toDate().toISOString(),
      expirationDate: newJob.expirationDate ? newJob.expirationDate.toDate().toISOString() : null,
    };
    
    return res.status(201).json({ message: 'Job posted successfully!', job: finalJob });

  } catch (error) {
    console.error('Error posting job:', error);
    if (error instanceof Error) {
        return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
    return res.status(500).json({ message: 'An unknown internal server error occurred.' });
  }
}
