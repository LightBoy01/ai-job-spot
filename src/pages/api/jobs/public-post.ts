import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import DOMPurify from 'isomorphic-dompurify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      title,
      company,
      location,
      applicationLink,
      description,
      contactEmail,
    } = req.body;

    // --- Server-Side Validation ---
    if (
      !title ||
      !company ||
      !location ||
      !applicationLink ||
      !description ||
      !contactEmail
    ) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Invalid contact email format.' });
    }
    if (!/^https?:\/\/.+/.test(applicationLink)) {
      return res
        .status(400)
        .json({ error: 'Invalid application link format.' });
    }

    // --- Sanitization ---
    const sanitizedDescription = DOMPurify.sanitize(description);

    const newJobData = {
      title,
      company,
      location,
      applicationLink,
      description: sanitizedDescription,
      contactEmail, // For internal use/notifications
      status: 'pending_review', // **CRITICAL: Force status to pending review**
      isNew: true,
      postedDate: FieldValue.serverTimestamp(), // Set server-side
      // Set other fields to null or default values
      companyLogoUrl: req.body.companyLogoUrl || null,
      salaryRange: null,
      tags: [],
      responsibilities: [],
      qualifications: [],
      preferredQualifications: [],
      jobLevel: null,
      employeeRole: null,
      expirationDate: null,
      applicationExperience: null,
      glassdoorLink: null,
      crunchbaseLink: null,
      source: 'Public Submission',
      story_question1: null,
      story_answer1: null,
      story_question2: null,
      story_answer2: null,
      story_question3: null,
      story_answer3: null,
      companyCulture: null,
    };

    const docRef = await adminDb.collection('jobs').add(newJobData);

    res.status(201).json({
      message: 'Job submitted for review successfully',
      jobId: docRef.id,
    });
  } catch (error) {
    console.error('Error in /api/jobs/public-post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
