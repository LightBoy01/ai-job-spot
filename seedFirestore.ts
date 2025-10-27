import { getFirebaseAdmin, admin } from './src/lib/firebaseAdmin.ts';
import type { JobPosting } from './src/lib/types.js';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { articleSchema, jobSchema } from './src/lib/schemas';
import {
  notifyBatch,
} from './scripts/indexing_api_client.js';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const SITE_URL = 'https://www.aijobspot.online';
const isDryRun = process.argv.includes('--dry-run');

/**
 * Seeds the 'sources' collection from the local JSON config file.
 */
async function seedSources(db: admin.firestore.Firestore): Promise<void> {
  console.log('Seeding sources from local config...');
  const sourcesPath = path.resolve(process.cwd(), 'src', 'config', 'sources.json');
  
  try {
    const sourcesFile = await fs.readFile(sourcesPath, 'utf-8');
    const sourcesData = JSON.parse(sourcesFile);

    if (!Array.isArray(sourcesData)) {
      throw new Error('sources.json is not a valid array.');
    }

    const sourcesCollection = db.collection('sources');
    const batch = db.batch();

    for (const source of sourcesData) {
      if (!source.sourceName) {
        console.warn('[SKIPPING] Source found without a sourceName.', source);
        continue;
      }
      
      // Convert ISO string back to Timestamp if it exists
      if (source.lastFetchedAt) {
        source.lastFetchedAt = admin.firestore.Timestamp.fromDate(new Date(source.lastFetchedAt));
      }

      const docRef = sourcesCollection.doc(source.sourceName);
      batch.set(docRef, source, { merge: true });
    }

    await batch.commit();
    console.log(`Successfully seeded ${sourcesData.length} sources.`);

  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn('Skipping sources seeding: src/config/sources.json not found.');
    } else {
      console.error('Error seeding sources:', error);
      throw error; // Re-throw to fail the seed process if the file is invalid
    }
  }
}

/**
 * Executes the database backup script.
 * @throws {Error} If the backup script fails.
 */
export async function runBackup(): Promise<void> {
  if (isDryRun) {
    console.log('[DRY RUN] Skipping database backup.');
    return;
  }
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

      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = DOMPurify.sanitize(data[key], { USE_PROFILES: { html: false } });
        }
      }

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
 * @returns A promise that resolves to an array of URLs that were deleted.
 */
export async function syncDeletions(
  adminDb: admin.firestore.Firestore,
  collectionRef: admin.firestore.CollectionReference,
  localIds: Set<string>,
  collectionName: 'jobs' | 'articles'
): Promise<string[]> {
  console.log(`Syncing deletions for collection: ${collectionRef.path}...`);
  const remoteSnapshot = await collectionRef.select().get();
  const remoteIds = new Set(remoteSnapshot.docs.map((doc: { id: string }) => doc.id) as string[]);
  const idsToDelete = [...remoteIds].filter((id) => !localIds.has(id));
  const urlsToDelete: string[] = [];

  if (idsToDelete.length === 0) {
    console.log(`No documents to delete from ${collectionRef.path}.`);
    return [];
  }

  console.log(`Found ${idsToDelete.length} documents to delete from ${collectionRef.path}.`);

  if (isDryRun) {
    console.log('[DRY RUN] The following documents would be deleted:');
    idsToDelete.forEach(id => console.log(`- ${collectionRef.path}/${id}`));
    return idsToDelete.map(id => `${SITE_URL}/${collectionName}/${id}`);
  }

  const deleteBatch = adminDb.batch();
  for (const id of idsToDelete) {
    deleteBatch.delete(collectionRef.doc(id));
    urlsToDelete.push(`${SITE_URL}/${collectionName}/${id}`);
  }

  await deleteBatch.commit();
  console.log(`Successfully deleted ${idsToDelete.length} orphaned documents from ${collectionRef.path}.`);

  await notifyBatch(urlsToDelete, 'URL_DELETED');
  return urlsToDelete;
}

/**
 * Upserts a batch of items into a Firestore collection.
 * @returns A promise that resolves to an array of URLs that were upserted.
 */
async function upsertInBatches(
  adminDb: admin.firestore.Firestore,
  collectionRef: admin.firestore.CollectionReference,
  items: any[],
  idField: string,
  collectionName: 'jobs' | 'articles'
): Promise<string[]> {
    const urlsUpserted: string[] = [];
    const batchSize = 400;
    console.log(`Found ${items.length} ${collectionName} to process for upsert...`);

    for (let i = 0; i < items.length; i += batchSize) {
        const batchItems = items.slice(i, i + batchSize);
        const batch = adminDb.batch();
        console.log(`Processing batch ${i / batchSize + 1} for ${collectionRef.path} (items ${i + 1}-${i + batchItems.length})`);

        for (const item of batchItems) {
            const docId = item[idField];
            if (!docId) {
                console.warn(`[SKIPPING] Item found without an '${idField}'.`, item);
                continue;
            }
            const docRef = collectionRef.doc(docId);
            if (isDryRun) {
                console.log(`[DRY RUN] Would upsert document: ${collectionRef.path}/${docId}`);
            } else {
                batch.set(docRef, item, { merge: true });
            }
            urlsUpserted.push(`${SITE_URL}/${collectionName}/${docId}`);
        }

        if (!isDryRun) {
            await batch.commit();
            console.log(`Batch ${i / batchSize + 1} committed successfully.`);
        }
    }
    return urlsUpserted;
}


/**
 * Triggers on-demand revalidation for a list of paths in Next.js.
 */
export async function revalidatePaths(paths: string[]) {
  if (isDryRun) {
      console.log(`[DRY RUN] Would revalidate ${paths.length} paths.`);
      return;
  }
  const secret = process.env.REVALIDATE_SECRET_TOKEN?.trim();
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
        const body = await res.json();
        if (res.ok) {
          console.log(`[REVALIDATED] ${path}: Status ${res.status}`, body);
        } else {
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
  const withBackup = process.argv.includes('--with-backup');

  if (isDryRun) {
    console.log('*** RUNNING IN DRY-RUN MODE. NO CHANGES WILL BE MADE TO THE DATABASE. ***\n');
  } else {
    console.log('*** WARNING: RUNNING IN LIVE MODE. ALL CHANGES WILL BE WRITTEN TO THE DATABASE. ***\n');
  }

  if (withBackup && !isDryRun) {
    try {
      await runBackup();
    } catch (error) {
      process.exit(1);
    }
  } else if (withBackup && isDryRun) {
    console.log('[DRY RUN] Skipping database backup (backup does not run in dry mode).\n');
  }

  console.log('Starting intelligent Firestore data seeding from local files...');
  const { adminDb: db } = await getFirebaseAdmin();

  await seedSources(db); // Seed sources from config file

  const projectRoot = process.cwd();
  const articlesDir = path.join(projectRoot, 'src', 'articles');
  const jobsDir = path.join(projectRoot, 'src', 'job-descriptions');

  const jobsCollection = db.collection('jobs');
  const articlesCollection = db.collection('articles');

  const processedJobs = await processDirectory(jobsDir, 'jobs');
  const processedArticles = await processDirectory(articlesDir, 'articles');

  const localJobIds = new Set(processedJobs.map((j: { id: string }) => j.id).filter(Boolean));
  const localArticleSlugs = new Set(processedArticles.map((a: { slug: string }) => a.slug).filter(Boolean));

  const deletedJobUrls = await syncDeletions(db, jobsCollection, localJobIds, 'jobs');
  const deletedArticleUrls = await syncDeletions(db, articlesCollection, localArticleSlugs, 'articles');

  const upsertedJobUrls = await upsertInBatches(db, jobsCollection, processedJobs, 'id', 'jobs');
  const upsertedArticleUrls = await upsertInBatches(db, articlesCollection, processedArticles, 'slug', 'articles');

  const allUpdatedUrls = [...upsertedJobUrls, ...upsertedArticleUrls];

  if (!isDryRun && allUpdatedUrls.length > 0) {
    await notifyBatch(allUpdatedUrls, 'URL_UPDATED');
  }

  const pathsToRevalidate = [
    '/',
    '/articles',
    ...processedJobs.map((job) => `/jobs/${job.id}`),
    ...processedArticles.map((article) => `/articles/${article.slug}`),
  ];
  await revalidatePaths(pathsToRevalidate);

  if (isDryRun) {
      console.log('\n--- Dry Run Report ---');
      console.log(`SUMMARY:`);
      console.log(`- To be DELETED: ${deletedJobUrls.length} jobs, ${deletedArticleUrls.length} articles.`);
      console.log(`- To be UPSERTED: ${upsertedJobUrls.length} jobs, ${upsertedArticleUrls.length} articles.`);
      console.log(`- URLs for Google Indexing: ${allUpdatedUrls.length} (updated), ${deletedJobUrls.length + deletedArticleUrls.length} (deleted).`);
      console.log(`- Paths to Revalidate: ${pathsToRevalidate.length}`);
      console.log('\nDETAILS:');
      if(deletedJobUrls.length > 0) console.log('Jobs to be DELETED:', deletedJobUrls);
      if(deletedArticleUrls.length > 0) console.log('Articles to be DELETED:', deletedArticleUrls);
      if(upsertedJobUrls.length > 0) console.log('Jobs to be UPSERTED:', upsertedJobUrls);
      if(upsertedArticleUrls.length > 0) console.log('Articles to be UPSERTED:', upsertedArticleUrls);
  }
}

// --- EXECUTION BLOCK ---
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
