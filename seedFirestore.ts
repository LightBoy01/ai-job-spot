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
  const sourcesCollection = db.collection('sources');

  // --- Seeding Sources ---
  console.log('Seeding content sources...');
  const sources = [
    {
      sourceName: 'Google AI Blog',
      feedUrl: 'https://blog.google/technology/ai/rss/',
      adapter: 'RSS',
      type: 'Article',
      status: 'Pending', // Set to 'Pending' for initial processing
      fetchFrequency: 'daily',
    },
    // You can add more RSS feed sources here
  ];

  const sourceBatch = db.batch();
  for (const source of sources) {
    // Use the feedUrl to create a unique, filesystem-safe ID
    const sourceId = source.feedUrl.replace(/[^a-zA-Z0-9]/g, '_');
    const sourceRef = sourcesCollection.doc(sourceId);
    sourceBatch.set(sourceRef, source, { merge: true });
  }
  await sourceBatch.commit();
  console.log(`Seeded ${sources.length} sources into the 'sources' collection.`);

  const processedJobs = await processDirectory(jobsDir, 'jobs');
  const processedArticles = await processDirectory(articlesDir, 'articles');

  const localJobIds = new Set(processedJobs.map((j) => j.id).filter(Boolean));
  const localArticleSlugs = new Set(processedArticles.map((a) => a.slug).filter(Boolean));

  await syncDeletions(db, jobsCollection, localJobIds, 'jobs');
  await syncDeletions(db, articlesCollection, localArticleSlugs, 'articles');

  const upsertBatch = db.batch();
  let operationsCount = 0;

  console.log(`Found ${processedJobs.length} job files to process for upsert...`);
  for (const job of processedJobs) {
    if (!job.id) {
      console.warn(`[SKIPPING] Job file found without an 'id' in its frontmatter.`, job);
      continue;
    }
    const jobRef = jobsCollection.doc(job.id);
    upsertBatch.set(jobRef, job, { merge: true });
    operationsCount++;
    if (job.status === 'published') {
      await notifyUrlUpdate(`${SITE_URL}/jobs/${job.id}`);
    }
  }

  console.log(`Found ${processedArticles.length} article files to process for upsert...`);
  for (const article of processedArticles) {
    if (!article.slug) {
      console.warn(`[SKIPPING] Article file found without a 'slug' in its frontmatter.`, article);
      continue;
    }
    const articleRef = articlesCollection.doc(article.slug);
    upsertBatch.set(articleRef, article, { merge: true });
    operationsCount++;
  }

  if (operationsCount > 0) {
    await upsertBatch.commit();
    console.log(`Firestore upsert complete. Processed ${operationsCount} upsert operations.`);

    const pathsToRevalidate = [
      '/',
      '/articles',
      ...processedJobs.map((job) => `/jobs/${job.id}`),
      ...processedArticles.map((article) => `/articles/${article.slug}`),
    ];
    await revalidatePaths(pathsToRevalidate);
  } else {
    console.log('No valid Markdown files found to upsert. Firestore remains unchanged.');
  }
}

// --- EXECUTION BLOCK ---
// This allows the script to be run directly, but also to be imported for testing.
if (process.env.NODE_ENV !== 'test') {
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
