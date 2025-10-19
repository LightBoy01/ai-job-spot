const { admin } = require('../src/lib/firebaseAdmin.cts');
import type { firestore as FirestoreTypes } from 'firebase-admin';
const { marked } = require('marked');
const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const DOMPurify = require('isomorphic-dompurify');
const { SeedArticleSchema, SeedJobPostingSchema } = require('../src/lib/validationSchemas.cts');
const { CONTENT_MODEL } = require('../src/config/content-model.cts');

const SITE_URL = 'https://www.aijobspot.online';

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

      const plainTextContent = content.replace(/\n/g, ' ').replace(/(\**|\*|_|`|\[|\]|\(|\)|#)/g, '');
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
        let processedContent = content.replace(/\ \[\[Internal Link: (.*?)(\s*\]\])/g, (match: string, linkText: string) => `<a href="/articles/${linkText.toLowerCase().replace(/\s+/g, '-')}" >${linkText}</a>`);
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

async function seedContent(db: FirestoreTypes.Firestore, isDryRun: boolean) {
    const projectRoot = process.cwd();
    const allProcessedItems: any[] = [];
    const allUpsertedUrls: string[] = [];

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

    return { allProcessedItems, allUpsertedUrls };
}

module.exports = { seedContent, processDirectory, upsertInBatches };
