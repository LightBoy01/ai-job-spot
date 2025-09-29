import { getFirebaseAdmin, admin } from './src/lib/firebaseAdmin.ts';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import {
  notifyUrlUpdate,
  notifyUrlDelete,
} from './scripts/indexing_api_client.ts';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Local, self-contained interface for the enrichment process
interface JobToEnrich {
  id: string;
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  jobLevel?: string | null;
  employeeRole?: string | null;
  salaryRange?: string | null;
  story_question1?: string | null;
  story_answer1?: string | null;
  story_question2?: string | null;
  story_answer2?: string | null;
}


const execAsync = promisify(exec);

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const SITE_URL = 'https://www.aijobspot.online';

// --- ZOD SCHEMAS ---
export const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  author: z.string(),
  publishDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  issueNo: z.number(),
  volumeNo: z.number(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  excerpt: z.string(), // Added by our script
  author_take_question1: z.string().optional(),
  author_take_answer1: z.string().optional(),
  author_take_question2: z.string().optional(),
  author_take_answer2: z.string().optional(),
  contentBody: z.string().optional(), // Added by our script
});

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  applicationLink: z.string().url(),
  postedDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  expirationDate: z
    .union([z.date(), z.string().pipe(z.coerce.date())])
    .nullable()
    .optional(),
  tags: z.array(z.string()).optional(),
  status: z.string(),
  jobLevel: z.string().nullable().optional(),
  employeeRole: z.string().nullable().optional(),
  salaryRange: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  verificationDate: z
    .union([z.date(), z.string().pipe(z.coerce.date())])
    .nullable()
    .optional(),
  glassdoorLink: z.string().url().nullable().optional(),
  crunchbaseLink: z.string().url().nullable().optional(),
  companyLogoUrl: z.string().nullable().optional(),
  applicationExperience: z.string().optional(),
  excerpt: z.string(), // Added by our script
  description: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  story_question1: z.string().optional(),
  story_answer1: z.string().optional(),
  story_question2: z.string().optional(),
  story_answer2: z.string().optional(),
  story_question3: z.string().optional(),
  story_answer3: z.string().optional(),
  companyCulture: z.string().optional(),
});

// --- ENRICHMENT SCRIPT LOGIC ---
const ENRICH_BATCH_SIZE = 5;

async function getPendingJobs(db: admin.firestore.Firestore): Promise<JobPosting[]> {
    console.log(`Fetching up to ${ENRICH_BATCH_SIZE} jobs with status 'pending_review'...`);
    const jobsRef = db.collection('jobs');
    const q = jobsRef.where('status', '==', 'pending_review').limit(ENRICH_BATCH_SIZE);
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.log('No jobs found pending review.');
        return [];
    }

    const jobs: JobPosting[] = [];
    snapshot.forEach(doc => {
        jobs.push({ id: doc.id, ...doc.data() } as JobPosting);
    });

    console.log(`Found ${jobs.length} jobs to process.`);
    return jobs;
}

async function enrichJobData(job: JobPosting): Promise<Partial<JobPosting>> {
    console.log(`Enriching job: ${job.id}`);
    const prompt = `
      Analyze the following job description text and return a JSON object with the following fields:
      - "responsibilities": An array of strings, with each string being a key responsibility.
      - "qualifications": An array of strings, with each string being a key qualification.
      - "jobLevel": Infer the job level. Choose one of: ["Entry-Level", "Junior", "Mid-Senior", "Senior", "Lead", "Principal", "Director", "Executive"]. If unsure, return null.
      - "employeeRole": Infer the employee role. Choose one of: ["Individual Contributor", "Manager", "Lead"]. If unsure, return null.
      - "salaryRange": If a salary is mentioned, extract it as a string (e.g., "$150,000 - $200,000"). If not mentioned, return null.
      - "story_question1": Generate an insightful question a curious candidate might ask about this role's impact.
      - "story_answer1": Generate a compelling answer to question 1, highlighting the role's value.
      - "story_question2": Generate an insightful question about the team or company culture.
      - "story_answer2": Generate a compelling answer to question 2, reflecting a positive and collaborative environment.

      JOB DESCRIPTION TEXT:
      """
      ${job.description}
      """

      JSON OUPUT:
    `;

    console.log(`---- AI PROMPT for ${job.id} ----\n${prompt}\n--------------------------`);

    // SIMULATED AI RESPONSE
    const simulatedAiResponse = {
        responsibilities: [
            "Lead product discovery efforts through user research and data analysis.",
            "Prioritize product roadmap based on business impact.",
            "Own the product execution process with designers and engineers."
        ],
        qualifications: [
            "3+ years of product management experience in a technical environment.",
            "Experience with both building new products (0->1) and scaling existing ones (1->n).",
            "Familiarity with AI/ML systems or data infrastructure.",
            "Strong systems thinking and communication skills."
        ],
        jobLevel: "Mid-Senior",
        employeeRole: "Individual Contributor",
        salaryRange: null,
        story_question1: "Beyond the daily tasks, what is the real strategic impact of this Product Manager role?",
        story_answer1: "You are not just managing features; you are shaping the future of clinician-AI interaction, directly contributing to our mission of restoring joy to the practice of medicine.",
        story_question2: "How does the product team collaborate with engineering and clinical teams?",
        story_answer2: "Collaboration is at our core. The product team acts as a bridge, embedding with engineering in agile sprints and holding regular deep-dive sessions with our community of clinician innovators."
    };

    return simulatedAiResponse;
}

async function enrichJobs() {
    const { adminDb: db } = await getFirebaseAdmin();
    const jobsToProcess = await getPendingJobs(db);

    if (jobsToProcess.length === 0) return;

    for (const job of jobsToProcess) {
        try {
            const enrichedData = await enrichJobData(job);
            const finalPayload: Partial<JobPosting> = { status: 'pending_approval' };

            // "Enrich, Don't Overwrite" Logic
            if (!job.responsibilities || job.responsibilities.length === 0) finalPayload.responsibilities = enrichedData.responsibilities;
            if (!job.qualifications || job.qualifications.length === 0) finalPayload.qualifications = enrichedData.qualifications;
            if (!job.jobLevel) finalPayload.jobLevel = enrichedData.jobLevel;
            if (!job.employeeRole) finalPayload.employeeRole = enrichedData.employeeRole;
            if (!job.salaryRange) finalPayload.salaryRange = enrichedData.salaryRange;
            if (!job.story_question1) {
                finalPayload.story_question1 = enrichedData.story_question1;
                finalPayload.story_answer1 = enrichedData.story_answer1;
            }
            if (!job.story_question2) {
                finalPayload.story_question2 = enrichedData.story_question2;
                finalPayload.story_answer2 = enrichedData.story_answer2;
            }

            console.log(`---- DRY RUN: Payload for job ${job.id} ----`);
            console.log(JSON.stringify(finalPayload, null, 2));
            console.log('---------------------------------------------\n');

            // To run for real, uncomment the following line:
            // await db.collection('jobs').doc(job.id).set(finalPayload, { merge: true });
            await db.collection('jobs').doc(job.id).set(finalPayload, { merge: true });

        } catch (error) {
            console.error(`Failed to process job ${job.id}. Error:`, error);
        }
    }
    console.log('\nEnrichment script finished.');
}

// --- END ENRICHMENT SCRIPT LOGIC ---


/**
 * Executes the database backup script.
 * @throws {Error} If the backup script fails.
 */
export async function runBackup(): Promise<void> {
  console.log('Starting database backup...');
  try {
    const { stdout, stderr } = await execAsync('bash scripts/backup_database.sh');
    if (stdout) console.log('Backup script stdout:', stdout);
    if (stderr) console.warn('Backup script stderr:', stderr);
    console.log('Database backup completed successfully.');
  } catch (error) {
    console.error('FATAL: Database backup failed. Aborting seed process.', error);
    throw new Error('Backup failed');
  }
}

/**
 * Reads markdown files, parses frontmatter/content, validates, and prepares for Firestore.
 * @param directoryPath The absolute path to the directory to scan.
 * @param contentType 'jobs' or 'articles'.
 * @returns A promise that resolves to an array of processed content objects.
 */
export async function processDirectory(
  directoryPath: string,
  contentType: 'jobs' | 'articles'
): Promise<any[]> {
  const items = [];
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      if (path.extname(file) !== '.md') continue;

      const filePath = path.join(directoryPath, file);

      const fileStats = await fs.stat(filePath);
      if (fileStats.size > 1 * 1024 * 1024) { // 1MB limit
        console.warn(`[SKIPPING] File ${file} exceeds 1MB size limit.`);
        continue;
      }

      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      const plainTextContent = content.replace(/\n/g, ' ').replace(/(\*\*|\*|_|`|\[|\]|\(|\)|#)/g, '');
      data.excerpt = plainTextContent.substring(0, 160);

      let finalData: any = { ...data };

      if (contentType === 'jobs') {
        let description = content;
        let responsibilities: string[] = [];
        let qualifications: string[] = [];
        const respRegex = /\n###\s+Responsibilities\n/i;
        const qualRegex = /\n###\s+Qualifications\n/i;
        const qualMatch = content.match(qualRegex);
        const respMatch = content.match(respRegex);
        let respIndex = respMatch?.index ?? -1;
        let qualIndex = qualMatch?.index ?? -1;

        if (qualIndex !== -1) {
          qualifications = content.substring(qualIndex + qualMatch![0].length).split('\n').map(s => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
        }
        if (respIndex !== -1) {
          const respEndIndex = qualIndex !== -1 ? qualIndex : content.length;
          responsibilities = content.substring(respIndex + respMatch![0].length, respEndIndex).split('\n').map(s => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
        }
        const firstHeadingIndex = respIndex !== -1 ? respIndex : (qualIndex !== -1 ? qualIndex : content.length);
        description = content.substring(0, firstHeadingIndex).trim();

        finalData.description = DOMPurify.sanitize(await marked(description));
        finalData.responsibilities = responsibilities;
        finalData.qualifications = qualifications;
      } else {
        let processedContent = content.replace(/\ \[\[Internal Link: (.*?)\]\]/g, (match, linkText) => `<a href="/articles/${linkText.toLowerCase().replace(/\s+/g, '-')}" class="text-secondary-dark hover:underline">${linkText}</a>`);
        processedContent = processedContent.replace(/\ \[\[External Link: (.*?)\ \]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-secondary-dark hover:underline">$1</a>');
        finalData.contentBody = DOMPurify.sanitize(await marked(processedContent));
      }

      try {
        if (contentType === 'jobs') jobSchema.parse(finalData);
        else articleSchema.parse(finalData);
      } catch (error) {
        console.error(`[VALIDATION FAILED] for ${file}:`, error);
        continue;
      }

      if (finalData.postedDate) finalData.postedDate = admin.firestore.Timestamp.fromDate(new Date(finalData.postedDate));
      if (finalData.expirationDate) finalData.expirationDate = admin.firestore.Timestamp.fromDate(new Date(finalData.expirationDate));
      if (finalData.publishDate) finalData.publishDate = admin.firestore.Timestamp.fromDate(new Date(finalData.publishDate));
      if (finalData.verificationDate) finalData.verificationDate = admin.firestore.Timestamp.fromDate(new Date(finalData.verificationDate));

      items.push(finalData);
    }
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
  }
  return items;
}

/**
 * Deletes documents from a Firestore collection that do not have a corresponding local file.
 * @param collectionRef A reference to the Firestore collection.
 * @param localIds A Set of IDs from the local markdown files.
 * @param collectionName The name of the collection ('jobs' or 'articles').
 */
export async function syncDeletions(
  adminDb: admin.firestore.Firestore,
  collectionRef: admin.firestore.CollectionReference,
  localIds: Set<string>,
  collectionName: 'jobs' | 'articles'
) {
  console.log(`Syncing deletions for collection: ${collectionRef.path}...`);
  const remoteSnapshot = await collectionRef.select().get();
  const remoteIds = new Set(remoteSnapshot.docs.map((doc) => doc.id));
  const idsToDelete = [...remoteIds].filter((id) => !localIds.has(id));

  if (idsToDelete.length === 0) {
    console.log(`No documents to delete from ${collectionRef.path}.`);
    return;
  }

  console.log(`Found ${idsToDelete.length} documents to delete from ${collectionRef.path}:`, idsToDelete);

  const deleteBatch = adminDb.batch();
  for (const id of idsToDelete) {
    deleteBatch.delete(collectionRef.doc(id));
    if (collectionName === 'jobs') {
      const url = `${SITE_URL}/jobs/${id}`;
      await notifyUrlDelete(url);
    }
  }

  await deleteBatch.commit();
  console.log(`Successfully deleted ${idsToDelete.length} orphaned documents from ${collectionRef.path}.`);
}

/**
 * Triggers on-demand revalidation for a list of paths in Next.js.
 * @param paths An array of URL paths to revalidate.
 */
export async function revalidatePaths(paths: string[]) {
  const secret = process.env.REVALIDATE_SECRET_TOKEN;
  if (!secret) {
    console.warn('[REVALIDATION SKIPPED] REVALIDATE_SECRET_TOKEN not set.');
    return;
  }

  const revalidationPromises = paths.map((path) =>
    fetch(`${SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, path }),
    })
      .then(async (res) => {
        if (res.ok) {
          console.log(`[REVALIDATED] ${path}`);
        } else {
          const body = await res.json();
          console.error(`[REVALIDATION FAILED] for ${path}: Status ${res.status}`, body);
        }
      })
      .catch((err) => {
        console.error(`[REVALIDATION FAILED] for ${path}:`, err);
      })
  );

  await Promise.all(revalidationPromises);
  console.log('On-demand revalidation process complete.');
}

/**
 * The main orchestration function for the seeding process.
 */
export async function seedFirestore() {
  try {
    await runBackup();
  } catch (error) {
    process.exit(1);
  }

  console.log('Starting intelligent Firestore data seeding from Markdown files...');
  const { adminDb: db } = await getFirebaseAdmin();

  const projectRoot = process.cwd();
  const articlesDir = path.join(projectRoot, 'src', 'articles');
  const jobsDir = path.join(projectRoot, 'src', 'job-descriptions');

  const jobsCollection = db.collection('jobs');
  const articlesCollection = db.collection('articles');


  const processedJobs = await processDirectory(jobsDir, 'jobs');
  const processedArticles = await processDirectory(articlesDir, 'articles');

  const localJobIds = new Set(processedJobs.map((j) => j.id).filter(Boolean));
  const localArticleSlugs = new Set(processedArticles.map((a) => a.slug).filter(Boolean));

  await syncDeletions(db, jobsCollection, localJobIds, 'jobs');
  await syncDeletions(db, articlesCollection, localArticleSlugs, 'articles');

  const upsertInBatches = async (adminDb: admin.firestore.Firestore, collectionRef: admin.firestore.CollectionReference, items: any[], idField: string) => {
    const batchSize = 400; // Firestore batch limit is 500, use 400 to be safe
    for (let i = 0; i < items.length; i += batchSize) {
      const batchItems = items.slice(i, i + batchSize);
      const batch = adminDb.batch();
      console.log(`Processing batch ${i / batchSize + 1} for ${collectionRef.path} (items ${i + 1}-${i + batchItems.length})`);
      for (const item of batchItems) {
        if (!item[idField]) {
          console.warn(`[SKIPPING] Item found without an '${idField}' in its frontmatter.`, item);
          continue;
        }
        const docRef = collectionRef.doc(item[idField]);
        batch.set(docRef, item, { merge: true });
      }
      await batch.commit();
      console.log(`Batch ${i / batchSize + 1} committed successfully.`);
    }
  };

  console.log(`Found ${processedJobs.length} job files to process for upsert...`);
  await upsertInBatches(db, jobsCollection, processedJobs, 'id');

  console.log(`Found ${processedArticles.length} article files to process for upsert...`);
  await upsertInBatches(db, articlesCollection, processedArticles, 'slug');

  // Revalidation logic needs to be adjusted if we process many files,
  // as it might hit rate limits. For now, we keep it simple.
  const pathsToRevalidate = [
    '/',
    '/articles',
    ...processedJobs.map((job) => `/jobs/${job.id}`),
    ...processedArticles.map((article) => `/articles/${article.slug}`),
  ];
  await revalidatePaths(pathsToRevalidate);

}

// --- EXECUTION BLOCK ---
if (process.env.NODE_ENV !== 'test') {
  const args = process.argv.slice(2);
  if (args.includes('--enrich')) {
    console.log('--enrich flag detected. Running job enrichment process...');
    enrichJobs().catch(err => console.error(err));
  } else {
    seedFirestore()
      .then(() => {
        console.log('\nSeeding process completed successfully.\n');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\nSeeding process failed.\n', error);
        process.exit(1);
      });
  }
}
