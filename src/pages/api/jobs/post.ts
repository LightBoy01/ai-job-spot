import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { JobPosting } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';

// Basic email validation regex
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const {
      title,
      company,
      location,
      description,
      applyLink,
      posterEmail,
      salaryRange,
      tags,
    } = req.body;

    // --- Server-side Validation ---
    if (!title || !company || !location || !description || !applyLink || !posterEmail) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!isValidEmail(posterEmail)) {
        return res.status(400).json({ message: 'Invalid email address provided.' });
    }

    // --- Data Sanitization & Preparation ---
    const sanitizedDescription = DOMPurify.sanitize(description);
    const newJobRef = adminDb.collection('jobs').doc();
    
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);

    // Use standard Date objects. Firebase Admin SDK will convert them to Timestamps.
    const newJob: Omit<JobPosting, 'id' | 'responsibilities' | 'qualifications' | 'preferredQualifications' | 'jobLevel' | 'employeeRole'> = {
      title,
      company,
      location,
      description: sanitizedDescription,
      applicationLink: applyLink,
      postedDate: new Date(),
      salaryRange: salaryRange || null,
      tags: tags || [],
      isNew: true,
      expirationDate: expiration,
      status: 'pending_review', // Set status to pending review
    };

    // --- Firestore Operation ---
    await newJobRef.set(newJob);

    console.log(`New job posted with ID: ${newJobRef.id}`);

    // --- Trigger Revalidation ---
    await res.revalidate('/');
    await res.revalidate(`/jobs/${newJobRef.id}`);
    
    return res.status(201).json({ message: 'Job posted successfully!', jobId: newJobRef.id });

  } catch (error) {
    console.error('Error posting job:', error);
    if (error instanceof Error) {
        return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
    return res.status(500).json({ message: 'An unknown internal server error occurred.' });
  }
}
