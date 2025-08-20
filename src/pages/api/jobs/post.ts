import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { JobPosting } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';

export default async function handler(
  req: AuthenticatedNextApiRequest, // Use AuthenticatedNextApiRequest
  res: NextApiResponse
) {
  // Enforce admin authentication
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const jobData = req.body;

    // --- Comprehensive Server-Side Validation ---
    const errors: Record<string, string> = {};
    if (!jobData.title || typeof jobData.title !== 'string') errors.title = 'Job Title is required.';
    if (!jobData.company || typeof jobData.company !== 'string') errors.company = 'Company is required.';
    if (!jobData.location || typeof jobData.location !== 'string') errors.location = 'Location is required.';
    if (!jobData.description || typeof jobData.description !== 'string' || jobData.description === '<p><br></p>') errors.description = 'Job Description is required.';
    if (!jobData.applicationLink) {
      errors.applicationLink = 'Application Link is required.';
    } else if (!/^https?:\/\/.+/.test(jobData.applicationLink)) {
      errors.applicationLink = 'Please enter a valid URL for the Application Link.';
    }
    if (!jobData.postedDate) errors.postedDate = 'Posted Date is required.';

    if (jobData.postedDate && jobData.expirationDate) {
      if (new Date(jobData.expirationDate) <= new Date(jobData.postedDate)) {
        errors.expirationDate = 'Expiration Date must be after Posted Date.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', details: errors });
    }
    // --- End Validation ---

    // --- Data Sanitization & Preparation ---
    const sanitizedDescription = DOMPurify.sanitize(jobData.description);
    const newJobRef = adminDb.collection('jobs').doc();
    
    const postedDate = new Date(jobData.postedDate);
    const expirationDate = jobData.expirationDate ? new Date(jobData.expirationDate) : new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newJob: Omit<JobPosting, 'id'> = {
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: sanitizedDescription,
      applicationLink: jobData.applicationLink,
      postedDate: admin.firestore.Timestamp.fromDate(postedDate),
      expirationDate: admin.firestore.Timestamp.fromDate(expirationDate),
      salaryRange: jobData.salaryRange || null,
      tags: jobData.tags ? jobData.tags.split(',').map((tag: string) => tag.trim()) : [],
      isNew: true,
      status: 'published', // Admin posts are published by default
      jobLevel: jobData.jobLevel || null,
      employeeRole: jobData.employeeRole || null,
      responsibilities: jobData.responsibilities ? jobData.responsibilities.split('\n').map((r: string) => r.trim()) : [],
      qualifications: jobData.qualifications ? jobData.qualifications.split('\n').map((q: string) => q.trim()) : [],
    };

    // --- Firestore Operation ---
    await newJobRef.set(newJob);

    console.log(`New job posted with ID: ${newJobRef.id}`);

    // --- Trigger Revalidation ---
    try {
      await res.revalidate('/');
      await res.revalidate(`/jobs/${newJobRef.id}`);
    } catch (revalError) {
      console.error('Error during revalidation:', revalError);
    }
    
    return res.status(201).json({ message: 'Job posted successfully!', jobId: newJobRef.id });

  } catch (error) {
    console.error('Error posting job:', error);
    if (error instanceof Error) {
        return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
    return res.status(500).json({ message: 'An unknown internal server error occurred.' });
  }
}
