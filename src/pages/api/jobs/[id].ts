import type { NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FirestoreJobPosting, JobPosting } from '@/lib/types';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, AuthenticatedNextApiRequest } from '@/lib/middleware';
import { validatePayload, isRequired, isURL, safeToTimestamp, isAfter, slugify } from '@/lib/apiUtils';
import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

// This function is a utility to find a job's markdown file
async function findJobFile(jobId: string): Promise<string | null> {
    const jobsDir = path.join(process.cwd(), 'src', 'job-descriptions');
    try {
        const files = await fs.readdir(jobsDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(jobsDir, file);
                const fileContent = await fs.readFile(filePath, 'utf8');
                if (fileContent.includes(`id: ${jobId}`)) {
                    return filePath;
                }
            }
        }
    } catch (error) {
        console.error('Error searching for job file:', error);
    }
    return null;
}

// This type represents the shape of the data coming from the frontend form
type JobFormData = Partial<Omit<JobPosting, 'id' | 'tags' | 'responsibilities' | 'qualifications'> & {
  tags: string;
  responsibilities: string;
  qualifications: string;
}>;

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
        const jobData: JobFormData = req.body;

        const errors = validatePayload(jobData, {
            title: [isRequired('Job Title')],
            company: [isRequired('Company')],
            location: [isRequired('Location')],
            description: [isRequired('Job Description')],
            applicationLink: [isRequired('Application Link'), isURL('Application Link')],
            expirationDate: [isAfter('postedDate', 'Posted Date')],
        });

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({ message: 'Validation failed', details: errors });
        }

        const updateData: Partial<FirestoreJobPosting> = {};

        // Build the update object safely, only including fields that were passed
        if (jobData.title) updateData.title = jobData.title;
        if (jobData.company) updateData.company = jobData.company;
        if (jobData.location) updateData.location = jobData.location;
        if (jobData.description) updateData.description = DOMPurify.sanitize(jobData.description);
        if (jobData.applicationLink) updateData.applicationLink = jobData.applicationLink;
        if (jobData.salaryRange) updateData.salaryRange = jobData.salaryRange;
        if (jobData.tags) updateData.tags = jobData.tags.split(',').map(tag => tag.trim());
        if (jobData.status) updateData.status = jobData.status;
        if (jobData.jobLevel) updateData.jobLevel = jobData.jobLevel;
        if (jobData.employeeRole) updateData.employeeRole = jobData.employeeRole;
        if (jobData.responsibilities) updateData.responsibilities = jobData.responsibilities.split('\n').filter(r => r.trim() !== '');
        if (jobData.qualifications) updateData.qualifications = jobData.qualifications.split('\n').filter(q => q.trim() !== '');

        if (jobData.story_question1) updateData.story_question1 = jobData.story_question1;
        if (jobData.story_answer1) updateData.story_answer1 = jobData.story_answer1;
        if (jobData.story_question2) updateData.story_question2 = jobData.story_question2;
        if (jobData.story_answer2) updateData.story_answer2 = jobData.story_answer2;
        if (jobData.story_question3) updateData.story_question3 = jobData.story_question3;
        if (jobData.story_answer3) updateData.story_answer3 = jobData.story_answer3;

        if (jobData.postedDate) {
            const timestamp = safeToTimestamp(jobData.postedDate, 'now');
            if (timestamp) {
                updateData.postedDate = timestamp;
            }
        }
        if (jobData.expirationDate) {
            const timestamp = safeToTimestamp(jobData.expirationDate, 'null');
            if (timestamp) {
                updateData.expirationDate = timestamp;
            }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No valid fields provided for update.' });
        }

        await jobRef.update(updateData);

        // --- Update or Create Markdown File ---
        const updatedDoc = await jobRef.get();
        const updatedJobData = updatedDoc.data() as FirestoreJobPosting;

        const markdownDescription = turndownService.turndown(updatedJobData.description || '');
        let markdownBody = markdownDescription;
        if (updatedJobData.responsibilities && updatedJobData.responsibilities.length > 0) {
            markdownBody += '\n\n### Responsibilities\n\n' + updatedJobData.responsibilities.map(r => `- ${r}`).join('\n');
        }
        if (updatedJobData.qualifications && updatedJobData.qualifications.length > 0) {
            markdownBody += '\n\n### Qualifications\n\n' + updatedJobData.qualifications.map(q => `- ${q}`).join('\n');
        }

        const frontmatter = `---\nid: ${id}\ntitle: "${updatedJobData.title.replaceAll('"', '\"')}"\ncompany: "${updatedJobData.company.replaceAll('"', '\"')}"\nlocation: "${updatedJobData.location.replaceAll('"', '\"')}"\napplicationLink: ${updatedJobData.applicationLink}\npostedDate: ${updatedJobData.postedDate.toDate().toISOString()}\nexpirationDate: ${updatedJobData.expirationDate ? updatedJobData.expirationDate.toDate().toISOString() : 'null'}\ntags:\n${(updatedJobData.tags || []).map(t => `  - ${t}`).join('\n')}\nstatus: ${updatedJobData.status}\njobLevel: ${updatedJobData.jobLevel || 'null'}\nemployeeRole: ${updatedJobData.employeeRole || 'null'}\nsalaryRange: ${updatedJobData.salaryRange || 'null'}\nstory_question1: "${(updatedJobData.story_question1 || '').replaceAll('"', '\"')}"\nstory_answer1: "${(updatedJobData.story_answer1 || '').replaceAll('"', '\"')}"\nstory_question2: "${(updatedJobData.story_question2 || '').replaceAll('"', '\"')}"\nstory_answer2: "${(updatedJobData.story_answer2 || '').replaceAll('"', '\"')}"\nstory_question3: "${(updatedJobData.story_question3 || '').replaceAll('"', '\"')}"\nstory_answer3: "${(updatedJobData.story_answer3 || '').replaceAll('"', '\"')}"\n---\n\n${markdownBody}\n`;
        
        let filepath = await findJobFile(id);
        if (!filepath) {
            const filename = `job-${slugify(updatedJobData.title)}-${id.substring(0, 6)}.md`;
            filepath = path.join(process.cwd(), 'src', 'job-descriptions', filename);
        }
        await fs.writeFile(filepath, frontmatter);
        console.log(`Markdown file updated for job ${id} at ${filepath}`);
        // --- End Update Markdown File ---


        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/');
          await res.revalidate(`/jobs/${id}`);
        } catch (revalError) {
          console.error('Error during revalidation after job update:', revalError);
        }

        const finalJob = {
          id: updatedDoc.id,
          ...updatedJobData,
          // Convert Timestamps to ISO strings for JSON serialization
          postedDate: updatedJobData.postedDate.toDate().toISOString(),
          expirationDate: updatedJobData.expirationDate ? updatedJobData.expirationDate.toDate().toISOString() : null,
        };

        res.status(200).json({ message: 'Job posting updated successfully', job: finalJob });
      } catch (error) {
        console.error('Error updating document: ', error);
        res.status(500).json({ error: 'Failed to update job posting' });
      }
      break;

    case 'DELETE':
      try {
        // --- Delete Markdown File ---
        const filepath = await findJobFile(id);
        if (filepath) {
            await fs.unlink(filepath);
            console.log(`Markdown file deleted for job ${id} from ${filepath}`);
        }
        // --- End Delete Markdown File ---

        await jobRef.delete();

        // Trigger revalidation for relevant pages
        try {
          await res.revalidate('/'); // Revalidate home page
          await res.revalidate(`/jobs/${id}`); // Revalidate specific job page
        } catch (revalError) {
          console.error('Error during revalidation after job deletion:', revalError);
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