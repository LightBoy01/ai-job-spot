const { getFirebaseAdmin, admin } = require('./src/lib/firebaseAdmin.cts');
import type { firestore as FirestoreTypes } from 'firebase-admin';
const { marked } = require('marked');
const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const DOMPurify = require('isomorphic-dompurify');
const { z } = require('zod');
const { SeedArticleSchema, SeedJobPostingSchema } = require('./src/lib/validationSchemas.cts');
const { notifyBatch } = require('./scripts/indexing_api_client.cts');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { promisify } = require('util');
const { CONTENT_MODEL } = require('./src/config/content-model.cts');

const execAsync = promisify(exec);

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const SITE_URL = 'https://www.aijobspot.online';

async function seedSources(db: FirestoreTypes.Firestore, isDryRun: boolean): Promise<void> {
  console.log('Seeding sources from local config...');
  const sourcesPath = path.resolve(process.cwd(), 'src', 'config', 'sources.json');
  
  try {
    const sourcesFile = await fs.readFile(sourcesPath, 'utf-8');
    const sourcesData = JSON.parse(sourcesFile);

    if (!Array.isArray(sourcesData)) {
      throw new Error('sources.json is not a valid array.');
    }

    if (isDryRun) {
        console.log(`[DRY RUN] Would seed ${sourcesData.length} sources.`);
        return;
    }

    const sourcesCollection = db.collection('sources');
    const batch = db.batch();

    for (const source of sourcesData) {
      if (!source.sourceName) {
        console.warn('[SKIPPING] Source found without a sourceName.', source);
        continue;
      }
      
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
      throw error;
    }
  }
}

async function processDirectory(
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
          qualifications = content.substring(qualIndex + qualMatch![0].length).split('\n').map((s: string) => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
        }
        if (respIndex !== -1) {
          const respEndIndex = qualIndex !== -1 ? qualIndex : content.length;
          responsibilities = content.substring(respIndex + respMatch![0].length, respEndIndex).split('\n').map((s: string) => s.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
        }
        const firstHeadingIndex = respIndex !== -1 ? respIndex : (qualIndex !== -1 ? qualIndex : content.length);
        description = content.substring(0, firstHeadingIndex).trim();

        finalData.description = DOMPurify.sanitize(await marked(description));
        finalData.responsibilities = responsibilities;
        finalData.qualifications = qualifications;
      } else {
        let processedContent = content.replace(/\ \[\[Internal Link: (.*?)\]\]/g, (match: string, linkText: string) => `<a href="/articles/${linkText.toLowerCase().replace(/\s+/g, '-')}" >${linkText}</a>`);
        processedContent = processedContent.replace(/\ \[\[External Link: (.*?)\ \]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" >$1</a>');
        finalData.contentBody = DOMPurify.sanitize(await marked(processedContent));
      }

      console.log('Validating:', finalData);
      try {
        if (contentType === 'jobs') SeedJobPostingSchema.parse(finalData);
        else SeedArticleSchema.parse(finalData);
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

async function upsertInBatches(
  adminDb: FirestoreTypes.Firestore,
  collectionRef: FirestoreTypes.CollectionReference,
  items: any[],
  idField: string,
  collectionName: string,
  isDryRun: boolean
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

async function revalidatePaths(paths: string[], isDryRun: boolean) {
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

async function seedFirestore(isDryRun = false) {
  if (isDryRun) {
    console.log('*** RUNNING IN DRY-RUN MODE. NO CHANGES WILL BE MADE TO THE DATABASE. ***\n');
  } else {
    console.log('*** WARNING: RUNNING IN LIVE MODE. ALL CHANGES WILL BE WRITTEN TO THE DATABASE. ***\n');
  }

  console.log('Starting intelligent Firestore data seeding from local files...');
  const { adminDb: db } = await getFirebaseAdmin();

  const jobsRef = db.collection('jobs');
  console.log('Querying for jobs with status: pending_review...');
  const snapshot = await jobsRef.where('status', '==', 'pending_review').get();

  if (snapshot.empty) {
    console.log('No pending jobs found to delete.');
  } else {
    const batchSize = 400;
    let batch = db.batch();
    let count = 0;

    console.log(`Found ${snapshot.size} pending jobs. Starting deletion...`);

    snapshot.docs.forEach((doc: any, index: any) => {
      batch.delete(doc.ref);
      count++;
      if (count % batchSize === 0 || index === snapshot.size - 1) {
        console.log(`Committing batch to delete ${count} jobs...`);
        if (!isDryRun) {
          batch.commit();
        }
        batch = db.batch();
        count = 0;
      }
    });
    console.log('Deletion process initiated.');
  }

  await seedSources(db, isDryRun);

  const projectRoot = process.cwd();
  const allProcessedItems: any[] = [];
  const allUpsertedUrls: string[] = [];
  const allDeletedUrls: string[] = [];

  for (const [contentType, config] of Object.entries(CONTENT_MODEL)) {
    const typedConfig = config as { operations: string[]; path: string; idField: string; };
    if (!typedConfig.operations.includes('seeding')) continue;

    console.log(`\n--- Processing [${contentType}] ---`);
    const directoryPath = path.join(projectRoot, typedConfig.path);
    
    const processType = contentType === 'jobs' ? 'jobs' : 'articles';
    const processedItems = await processDirectory(directoryPath, processType);
    
    if (processedItems.length === 0) {
      console.log(`No items found in ${typedConfig.path}. Skipping.`);
      continue;
    }

    allProcessedItems.push(...processedItems);

    const collection = db.collection(contentType);
    const upsertedUrls = await upsertInBatches(db, collection, processedItems, typedConfig.idField, contentType, isDryRun);
    allUpsertedUrls.push(...upsertedUrls);
  }

  if (!isDryRun && allUpsertedUrls.length > 0) {
    await notifyBatch(allUpsertedUrls, 'URL_UPDATED');
  }

  const pathsToRevalidate = [
    '/',
    '/articles',
    ...allProcessedItems.map((item) => {
      const id = item.id || item.slug;
      const pathPrefix = item.contentType === 'briefing' ? '/articles' : `/${item.contentType}s`;
      return `${pathPrefix}/${id}`;
    }),
  ];
  await revalidatePaths(pathsToRevalidate, isDryRun);

  if (isDryRun) {
      console.log('\n--- Dry Run Report ---');
      console.log(`SUMMARY:`);
      console.log(`- To be DELETED: ${allDeletedUrls.length} items.`);
      console.log(`- To be UPSERTED: ${allUpsertedUrls.length} items.`);
      console.log(`- URLs for Google Indexing: ${allUpsertedUrls.length} (updated), ${allDeletedUrls.length} (deleted).`);
      console.log(`- Paths to Revalidate: ${pathsToRevalidate.length}`);
      console.log('\nDETAILS:');
      if(allDeletedUrls.length > 0) console.log('Items to be DELETED:', allDeletedUrls);
      if(allUpsertedUrls.length > 0) console.log('Items to be UPSERTED:', allUpsertedUrls);
  }
}

// --- EXECUTION BLOCK ---
if (require.main === module) {
  const isStandaloneDryRun = process.argv.includes('--dry-run');
  seedFirestore(isStandaloneDryRun)
    .then(() => {
      console.log('\nSeeding process completed successfully.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nSeeding process failed.\n', error);
      process.exit(1);
    });
}

module.exports = { seedFirestore, processDirectory, revalidatePaths };