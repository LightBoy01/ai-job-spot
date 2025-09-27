import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { firestore } from 'firebase-admin';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Define the expected shape of the incoming scraped job data
const scrapedJobSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  company: z.string().min(1, { message: 'Company is required' }),
  location: z.string().min(1, { message: 'Location is required' }),
  link: z.string().url({ message: 'A valid application link URL is required' }),
  description: z.string().optional(),
  summary: z.string().optional(),
  source: z.string().optional(),
  salaryRange: z.string().optional(),
  jobLevel: z.string().optional(),
  employeeRole: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`DEBUG: Ingest API received method: ${req.method}`);
  console.log(
    `DEBUG: Ingest API received x-api-key: ${req.headers['x-api-key']}`
  );
  // 1. SECURE THE ENDPOINT
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = req.headers['x-api-key'];
  if (
    !process.env.PIPELINE_API_KEY ||
    apiKey !== process.env.PIPELINE_API_KEY
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    // 2. VALIDATE THE INCOMING DATA
    const jobData = scrapedJobSchema.parse(req.body);

    // 3. DUPLICATE CHECK (using a temporary, deterministic slug)
    const companySlug = jobData.company
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const titleSlug = jobData.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const duplicateCheckId = `scraped-${companySlug}-${titleSlug}`.slice(
      0,
      100
    );

    const existingJobsQuery = await adminDb
      .collection('jobs')
      .where('duplicateCheckId', '==', duplicateCheckId)
      .limit(1)
      .get();
    if (!existingJobsQuery.empty) {
      return res.status(200).json({
        message: 'Job already exists, skipping.',
        jobId: existingJobsQuery.docs[0].id,
      });
    }

    // 4. GENERATE NEW SEQUENTIAL JOB ID
    const jobsRef = adminDb.collection('jobs');
    const lastJobQuery = await jobsRef
      .orderBy(firestore.FieldPath.documentId())
      .limitToLast(1)
      .get();

    let newJobNumber = 1;
    if (!lastJobQuery.empty) {
      const lastJobId = lastJobQuery.docs[0].id;
      const match = lastJobId.match(/^job-(\d+)$/);
      if (match) {
        newJobNumber = parseInt(match[1], 10) + 1;
      }
    }
    const newJobId = `job-${newJobNumber}`;

    // 5. INGEST THE JOB with 'pending_review' status
    const newJobRef = jobsRef.doc(newJobId);
    const newJobPayload = {
      id: newJobId, // Add the ID to the document body as well
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      applicationLink: jobData.link,
      description: DOMPurify.sanitize(
        jobData.description ||
          jobData.summary ||
          '<p>No description provided.</p>'
      ),
      postedDate: new Date(),
      expirationDate: new Date(new Date().setDate(new Date().getDate() + 90)),
      status: 'pending_review',
      source: jobData.source || 'Scraped',
      salaryRange: jobData.salaryRange || null,
      jobLevel: jobData.jobLevel || null,
      employeeRole: jobData.employeeRole || null,
      tags: ['scraped'],
      isNew: true,
      responsibilities: [],
      qualifications: [],
      duplicateCheckId: duplicateCheckId, // Store the deterministic ID for future checks
    };

    await newJobRef.set(newJobPayload);

    return res.status(201).json({
      message: 'Job successfully ingested for review.',
      jobId: newJobId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Error in ingest API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
