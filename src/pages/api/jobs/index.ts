
import type { NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebaseAdmin'; // Import adminDb
import * as admin from 'firebase-admin';
import { JobPosting } from '../../../lib/types';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { requireAdmin, AuthenticatedNextApiRequest } from '../../../lib/middleware';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export default async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
) {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  if (req.method === 'POST') {
    try {
      const jobData: Omit<JobPosting, 'id'> = req.body;

      // Basic validation
      if (!jobData.title || !jobData.company || !jobData.description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const sanitizedDescription = purify.sanitize(jobData.description);

      // Use adminDb for server-side operations that bypass security rules
      const now = new Date();
      const defaultExpirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Helper to safely convert a Date or a Timestamp to a Firestore Timestamp
      const toTimestamp = (date: Date | admin.firestore.Timestamp | string | null | undefined): admin.firestore.Timestamp => {
        if (!date) return admin.firestore.Timestamp.fromDate(defaultExpirationDate);
        if (date instanceof Date) {
          return admin.firestore.Timestamp.fromDate(date);
        }
        if (typeof date === 'string') {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            return admin.firestore.Timestamp.fromDate(parsedDate);
          }
        }
        // Check if it's a Firestore Timestamp-like object
        if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
          return date as admin.firestore.Timestamp;
        }
        // Fallback for unexpected types
        return admin.firestore.Timestamp.fromDate(defaultExpirationDate);
      };

      const jobToSave = {
        ...jobData,
        description: sanitizedDescription,
        postedDate: admin.firestore.FieldValue.serverTimestamp(), // Let Firestore set the creation time
        expirationDate: toTimestamp(jobData.expirationDate),
      };

      const docRef = await adminDb.collection('jobs').add(jobToSave);

      res.status(201).json({ id: docRef.id });
    } catch (error) {
      console.error('Error adding document: ', error);
      res.status(500).json({ error: 'Failed to create job posting' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
