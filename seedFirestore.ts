/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirebaseAdmin, admin } from './src/lib/firebaseAdmin.js';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { articleSchema, jobSchema } from './src/lib/schemas.js';
import { calculateArticleCompleteness, calculateJobCompleteness } from './src/lib/completenessScore.js';
import { parseJobMarkdownFromContent } from './scripts/utils/job-markdown-parser.js';

type Article = z.infer<typeof articleSchema>;
type Job = z.infer<typeof jobSchema>;
import {
  notifyBatch,
} from './scripts/indexing_api_client.js';
import dotenv from 'dotenv';

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
export async function runBackup(db: admin.firestore.Firestore): Promise<void> {
  if (isDryRun) {
    console.log('[DRY RUN] Skipping database backup.');
    return;
  }

  console.log('Starting local database backup...');

  const collectionsToBackup = ['jobs', 'articles', 'sources'];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'storage', 'backups', `backup-${timestamp}`);

  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);

    for (const collectionName of collectionsToBackup) {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      if (snapshot.empty) {
        console.log(`Collection '${collectionName}' is empty, skipping.`);
        continue;
      }

      const data = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
      
      // Convert Firestore Timestamps to ISO strings for clean JSON
      const serializableData = data.map((item: any) => {
        const newItem: Record<string, any> = { ...item };
        for (const key in newItem) {
          if (newItem[key] instanceof admin.firestore.Timestamp) {
            newItem[key] = (newItem[key] as admin.firestore.Timestamp).toDate().toISOString();
          }
        }
        return newItem;
      });

      const filePath = path.join(backupDir, `${collectionName}.json`);
      await fs.writeFile(filePath, JSON.stringify(serializableData, null, 2));
      console.log(`Successfully backed up ${snapshot.size} documents from '${collectionName}' to ${filePath}`);
    }

    console.log('Local database backup completed successfully.');
  } catch (error) {
    console.error('FATAL: Local database backup failed. Aborting seed process.', error);
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
): Promise<(Job | Article)[]> {
  const items: (Job | Article)[] = [];
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

      // --- Common processing ---
      const plainTextContent = content.replace(/\n/g, ' ').replace(/(\*\*|\*|_|`|\[|\]|\(|\)|#)/g, '');
      data.excerpt = plainTextContent.substring(0, 160);

      for (const key in data) {
        if (typeof data[key] === 'string') {
          data[key] = DOMPurify.sanitize(data[key], { USE_PROFILES: { html: false } });
        }
      }
      if (data.tags && Array.isArray(data.tags)) {
        data.tags = data.tags.map((tag: string) => tag.toLowerCase());
      }
      if (data.hub && typeof data.hub === 'string') {
        data.hub = data.hub.toLowerCase();
      }
      // --- End of common processing ---

      if (contentType === 'jobs') {
        if (data.status !== 'published') {
          console.log(`[SKIPPING] Job ${file} is not published (status: ${data.status || 'undefined'}).`);
          continue;
        }

        const finalData: Partial<Job> = { ...data };
        const parsedMarkdown = await parseJobMarkdownFromContent(content);
        Object.assign(finalData, parsedMarkdown);

        if (!finalData.tweetableDescription) {
            const paragraphs = content.split('\n\n');
            let firstParagraph = '';
            for (const p of paragraphs) {
                if (p.trim() !== '' && !p.trim().startsWith('#')) {
                    firstParagraph = p.trim();
                    break;
                }
            }
            if (firstParagraph) {
                const plainText = firstParagraph.replace(/(\*|_|`|#|\[|\]|\(|\))/g, '');
                finalData.tweetableDescription = plainText.split('. ')[0] + '.';
            }
        }
        
        try {
          const validatedData = jobSchema.parse(finalData);
          items.push(validatedData as Job);
        } catch (error) {
          console.error(`[VALIDATION FAILED] for ${file}:`, error);
          continue;
        }

      } else { // It's an article
        const finalData: Partial<Article> = { ...data };
        
        let processedContent = content.replace(/\ \[\[Internal Link: (.*?)\]\]/g, (match, linkText) => `<a href="/articles/${linkText.toLowerCase().replace(/\s+/g, '-')}" class="text-secondary-dark hover:underline">${linkText}</a>`);
        processedContent = processedContent.replace(/\ \[\[External Link: (.*?)\ \]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-secondary-dark hover:underline">$1</a>');
        finalData.contentBody = DOMPurify.sanitize(await marked(processedContent));

        if (directoryPath.includes(path.join('src', 'content', 'briefings'))) {
          const fileNameWithoutExt = path.parse(file).name;
          finalData.slug = finalData.slug || fileNameWithoutExt;
          finalData.contentType = finalData.contentType || 'briefing';
          finalData.title = finalData.title || `Briefing: ${fileNameWithoutExt.replace(/-/g, ' ')}`;
          finalData.author = finalData.author || 'AI Job Spot Briefings';
          finalData.publishDate = finalData.publishDate || new Date();
          finalData.excerpt = finalData.excerpt || `A summary of insights from ${finalData.title}`;
          finalData.tags = finalData.tags || ['briefing'];
          finalData.issueNo = finalData.issueNo || 1;
          finalData.volumeNo = finalData.volumeNo || 1;
        }

        try {
          const validatedData = articleSchema.parse(finalData);
          items.push(validatedData as Article);
        } catch (error) {
          console.error(`[VALIDATION FAILED] for ${file}:`, error);
          continue;
        }
      }
    }
  } catch (error) {
    console.error(`FATAL: Error processing directory ${directoryPath}. Aborting.`, error);
    throw error; // Re-throw to halt the entire seed process
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
  const remoteIds = new Set(remoteSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.id));
  const idsToDelete = [...remoteIds].filter((id) => !localIds.has(id));

  // --- CIRCUIT BREAKER ---
    const DELETION_THRESHOLD = 0.9; // 90%
  const deletionPercentage = remoteIds.size > 0 ? idsToDelete.length / remoteIds.size : 0;

  if (deletionPercentage > DELETION_THRESHOLD) {
    const errorMessage = `SAFETY ABORT: Attempting to delete ${idsToDelete.length} of ${remoteIds.size} documents (${Math.round(deletionPercentage * 100)}%) from '${collectionRef.path}'. This exceeds the ${DELETION_THRESHOLD * 100}% threshold. If this is intentional, manually adjust the DELETION_THRESHOLD in seedFirestore.ts and re-run.`;
    console.error(`\n\n*** ${errorMessage} ***\n\n`);
    throw new Error(errorMessage);
  }
  // --- END CIRCUIT BREAKER ---

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
  items: (Job | Article)[],
  idField: keyof Job | keyof Article,
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
            const docId = item[idField as keyof typeof item];
            
            if (typeof docId !== 'string' || !docId) {
                console.warn(`[SKIPPING] Item found without a valid string ID for field '${String(idField)}'.`, item);
                continue;
            }
            const docRef = collectionRef.doc(docId);

            let completenessScore: number;
            if (collectionName === 'articles') {
                completenessScore = calculateArticleCompleteness(item as Article);
            } else { // collectionName === 'jobs'
                completenessScore = calculateJobCompleteness(item as Job);
            }

            const itemWithScore = { ...item, completenessScore };

            if (isDryRun) {
                console.log(`[DRY RUN] Would upsert document: ${collectionRef.path}/${docId} with score ${completenessScore}`);
            } else {
                batch.set(docRef, itemWithScore, { merge: true });
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

  console.log('Initializing Firebase Admin...');
  const { adminDb: db } = await getFirebaseAdmin();

  if (withBackup) {
    try {
      await runBackup(db); // Pass the db instance
    } catch (error) {
      // The error is already logged in runBackup, so just exit.
      process.exit(1);
    }
  }

  console.log('Starting intelligent Firestore data seeding from local files...');

  await seedSources(db); // Seed sources from config file

  const projectRoot = process.cwd();
    const articlesDir = path.join(projectRoot, 'src', 'articles');
  const briefingsDir = path.join(projectRoot, 'src', 'content', 'briefings');
  const jobsDir = path.join(projectRoot, 'src', 'job-descriptions');

  const jobsCollection = db.collection('jobs');
  const articlesCollection = db.collection('articles');

  const processedJobs = (await processDirectory(jobsDir, 'jobs')) as Job[];
  
  // Process editorials and briefings separately, then combine.
  const processedEditorials = (await processDirectory(articlesDir, 'articles')) as Article[];
  const processedBriefings = (await processDirectory(briefingsDir, 'articles')) as Article[]; // Processed as articles
  const processedArticles = [...processedEditorials, ...processedBriefings];

  const localJobIds = new Set(processedJobs.map((j: Job) => j.id).filter(Boolean));
  const localArticleSlugs = new Set(processedArticles.map((a: Article) => a.slug).filter(Boolean));

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
