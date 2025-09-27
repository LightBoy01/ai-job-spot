import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import * as cheerio from 'cheerio';
import { getFirebaseAdmin } from '../lib/firebaseAdmin.js';
import { Source } from '../lib/types';

async function migrateSources() {
  console.log('Starting source migration...');

  const { adminDb } = await getFirebaseAdmin();

  const sourcesPath = path.join(process.cwd(), 'docs', 'SOURCES.md');
  const markdownContent = await fs.readFile(sourcesPath, 'utf-8');

  const html = await marked(markdownContent);
  const $ = cheerio.load(html);

  const sources: Omit<Source, 'id'>[] = [];
  $('table tr').each((i, row) => {
    if (i === 0) return; // Skip header row
    const cells = $(row).find('td');
    sources.push({
      status: $(cells[0]).text().replace(/`/g, ''),
      type: $(cells[1]).text().replace(/`/g, '') as 'Job' | 'Article',
      adapter: $(cells[2]).text().replace(/`/g, '') as 'RSS' | 'RSS_HUB' | 'HIRING_CAFE' | 'HIRING_CAFE_API',
      sourceName: $(cells[3]).text(),
      feedUrl: $(cells[4]).text(),
      notes: $(cells[5]).text(),
    });
  });

  console.log(`Found ${sources.length} sources to migrate.`);

  const collectionRef = adminDb.collection('sources');
  const batch = adminDb.batch();

  for (const source of sources) {
    const docRef = collectionRef.doc(); // Let Firestore generate the ID
    batch.set(docRef, source);
  }

  await batch.commit();
  console.log(`Successfully migrated ${sources.length} sources to the 'sources' collection in Firestore.`);
}

migrateSources().catch(console.error);
