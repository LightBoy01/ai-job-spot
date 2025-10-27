import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin, admin } from '@/lib/firebaseAdmin';
import { JobPostingSchema } from '@/lib/validationSchemas';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import logger from '@/data-pipeline/utils/logger'; // Import the logger

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aijobspot.online';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    logger.warn({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Job post attempt without ID token.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const { adminDb, adminAuth } = await getFirebaseAdmin();
    // 1. Authenticate and Authorize User
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Optional: Check if the user has an admin custom claim
    const userRecord = await adminAuth.getUser(uid);
    if (!userRecord.customClaims || !userRecord.customClaims.admin) {
      logger.warn({ uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }, 'Job post attempt by non-admin user.');
      return res.status(403).json({ message: 'Forbidden: Not an admin' });
    }

    // 2. Input Validation with Zod
    const validationResult = JobPostingSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn({ uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, errors: validationResult.error.flatten() }, 'Job post validation failed.');
      return res.status(400).json({
        message: 'Invalid job posting data',
        errors: validationResult.error.flatten(),
      });
    }

    const jobData = validationResult.data;

    // 3. HTML Sanitization
    const sanitizedDescription = DOMPurify.sanitize(
      await marked(jobData.description || '')
    );

    // Convert responsibilities and qualifications from newline-separated strings to arrays
    const responsibilitiesArray = jobData.responsibilities
      ? jobData.responsibilities
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];
    const qualificationsArray = jobData.qualifications
      ? jobData.qualifications
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];
    const preferredQualificationsArray = jobData.preferredQualifications
      ? jobData.preferredQualifications
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];
    const tagsArray = jobData.tags
      ? jobData.tags
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];

    // Convert dates to Firestore Timestamps
    const postedDateTimestamp = jobData.postedDate
      ? admin.firestore.Timestamp.fromDate(new Date(jobData.postedDate))
      : admin.firestore.Timestamp.now();
    const expirationDateTimestamp = jobData.expirationDate
      ? admin.firestore.Timestamp.fromDate(new Date(jobData.expirationDate))
      : null;
    const verificationDateTimestamp = jobData.verificationDate
      ? admin.firestore.Timestamp.fromDate(new Date(jobData.verificationDate))
      : null;

    // Prepare job object for Firestore
    const newJobRef = adminDb.collection('jobs').doc(); // Let Firestore generate ID
    const jobToSave = {
      id: newJobRef.id,
      title: jobData.title,
      company: jobData.company,
      companyLogoUrl: jobData.companyLogoUrl || null,
      description: sanitizedDescription,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray,
      preferredQualifications: preferredQualificationsArray,
      location: jobData.location,
      salaryRange: jobData.salaryRange || null,
      postedDate: postedDateTimestamp,
      expirationDate: expirationDateTimestamp,
      applicationLink: jobData.applicationLink,
      applicationExperience: jobData.applicationExperience || null,
      tags: tagsArray,
      jobLevel: jobData.jobLevel || null,
      employeeRole: jobData.employeeRole || null,
      status: jobData.status || 'pending_review', // Default to pending review
      isNew: jobData.isNew ?? true,
      source: jobData.source || null,
      sourceUrl: jobData.sourceUrl || null,
      verificationDate: verificationDateTimestamp,
      glassdoorLink: jobData.glassdoorLink || null,
      crunchbaseLink: jobData.crunchbaseLink || null,
      story_question1: jobData.story_question1 || null,
      story_answer1: jobData.story_answer1 || null,
      story_question2: jobData.story_question2 || null,
      story_answer2: jobData.story_answer2 || null,
      story_question3: jobData.story_question3 || null,
      story_answer3: jobData.story_answer3 || null,
      companyCulture: jobData.companyCulture || null,
    };

    // 4. Save to Firestore
    await newJobRef.set(jobToSave);

    // 5. Revalidation (for homepage and jobs list)
    await Promise.all([
      revalidatePath('/'),
      revalidatePath('/jobs'),
      revalidatePath(`/jobs/${newJobRef.id}`),
    ]);

    logger.info({ uid, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, jobId: newJobRef.id }, 'Job posting created successfully.');
    res
      .status(201)
      .json({ message: 'Job posting created successfully', job: jobToSave });
  } catch (error) {
    logger.error({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, error: error instanceof Error ? error.message : String(error) }, 'Error creating job posting.');
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ message: 'Internal server error', error: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function revalidatePath(path: string) {
  const secret = process.env.REVALIDATE_SECRET_TOKEN;
  if (!secret) {
    console.warn('[REVALIDATION SKIPPED] REVALIDATE_SECRET_TOKEN not set.');
    return;
  }

  try {
    const revalidateRes = await fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ secret, path }),
    });

    if (!revalidateRes.ok) {
      console.error(
        `Failed to revalidate ${path}: Status ${revalidateRes.status}`
      );
    }
  } catch (err) {
    console.error(`Error revalidating ${path}:`, err);
  }
}
