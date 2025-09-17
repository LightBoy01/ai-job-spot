import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting, JobPosting } from '@/lib/types';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { validatePayload, isRequired, isURL, safeToTimestamp, isAfter, slugify } from '@/lib/apiUtils';
import DOMPurify from 'isomorphic-dompurify';
import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

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
    const jobId = newJobRef.id;

    const postedTimestamp = safeToTimestamp(jobData.postedDate, 'now')!;
    let expirationTimestamp = safeToTimestamp(jobData.expirationDate, 'null');

    if (!expirationTimestamp) {
        const thirtyDaysFromNow = new Date(postedTimestamp.toDate().getTime() + 30 * 24 * 60 * 60 * 1000);
        expirationTimestamp = safeToTimestamp(thirtyDaysFromNow, 'now');
    }
    
    const responsibilitiesArray = jobData.responsibilities ? jobData.responsibilities.split('\n').filter(r => r.trim() !== '') : [];
    const qualificationsArray = jobData.qualifications ? jobData.qualifications.split('\n').filter(q => q.trim() !== '') : [];

    const newJob: FirestoreJobPosting = {
      id: jobId,
      title: jobData.title!,
      company: jobData.company!,
      location: jobData.location!,
      description: sanitizedDescription,
      applicationLink: jobData.applicationLink!,
      postedDate: postedTimestamp,
      expirationDate: expirationTimestamp!,
      salaryRange: jobData.salaryRange || undefined,
      tags: jobData.tags ? jobData.tags.split(',').map((tag: string) => tag.trim()) : [],
      status: jobData.status || 'published',
      jobLevel: jobData.jobLevel || undefined,
      employeeRole: jobData.employeeRole || undefined,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray,
      story_question1: jobData.story_question1 || undefined,
      story_answer1: jobData.story_answer1 || undefined,
      story_question2: jobData.story_question2 || undefined,
      story_answer2: jobData.story_answer2 || undefined,
      story_question3: jobData.story_question3 || undefined,
      story_answer3: jobData.story_answer3 || undefined,
    };

    // --- Create Markdown File ---
    const markdownDescription = turndownService.turndown(sanitizedDescription);
    
    let markdownBody = markdownDescription;
    if (responsibilitiesArray.length > 0) {
        markdownBody += '\n\n### Responsibilities\n\n' + responsibilitiesArray.map(r => `- ${r}`).join('\n');
    }
    if (qualificationsArray.length > 0) {
        markdownBody += '\n\n### Qualifications\n\n' + qualificationsArray.map(q => `- ${q}`).join('\n');
    }

    const frontmatter = `---\nid: ${jobId}
title: "${jobData.title!.replaceAll('"', '\"')}"
company: "${jobData.company!.replaceAll('"', '\"')}"
location: "${jobData.location!.replaceAll('"', '\"')}"
applicationLink: ${jobData.applicationLink}
postedDate: ${postedTimestamp.toDate().toISOString()}
expirationDate: ${expirationTimestamp ? expirationTimestamp.toDate().toISOString() : 'null'}
tags:
${newJob.tags.map(t => `  - ${t}`).join('\n')}
status: ${newJob.status}
jobLevel: ${newJob.jobLevel || 'null'}
employeeRole: ${newJob.employeeRole || 'null'}
salaryRange: ${newJob.salaryRange || 'null'}
story_question1: "${(jobData.story_question1 || '').replaceAll('"', '\"')}"
story_answer1: "${(jobData.story_answer1 || '').replaceAll('"', '\"')}"
story_question2: "${(jobData.story_question2 || '').replaceAll('"', '\"')}"
story_answer2: "${(jobData.story_answer2 || '').replaceAll('"', '\"')}"
story_question3: "${(jobData.story_question3 || '').replaceAll('"', '\"')}"
story_answer3: "${(jobData.story_answer3 || '').replaceAll('"', '\"')}"
---\n\n${markdownBody}\n`;

    const filename = `job-${slugify(jobData.title!)}-${jobId.substring(0, 6)}.md`;
    const filepath = path.join(process.cwd(), 'src', 'job-descriptions', filename);

    await fs.writeFile(filepath, frontmatter);
    // --- End Create Markdown File ---


    await newJobRef.set(newJob);

    try {
      await res.revalidate('/');
      await res.revalidate(`/jobs/${jobId}`);
    } catch (revalError) {
      console.error('Error during revalidation:', revalError);
    }
    
    const finalJob = {
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