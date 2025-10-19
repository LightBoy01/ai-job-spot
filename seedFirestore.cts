const { getFirebaseAdmin, admin } = require('./src/lib/firebaseAdmin.cts');
const { notifyBatch } = require('./scripts/indexing_api_client.cts');
const { revalidatePaths } = require('./scripts/revalidate-paths.cts');
const { seedContent } = require('./scripts/seed-content.cts');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

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





async function seedFirestore(isDryRun = false) {
  if (isDryRun) {
    console.log('*** RUNNING IN DRY-RUN MODE. NO CHANGES WILL BE MADE TO THE DATABASE. ***\n');
  } else {
    console.log('*** WARNING: RUNNING IN LIVE MODE. ALL CHANGES WILL BE WRITTEN TO THE DATABASE. ***\n');
  }

  console.log('Starting intelligent Firestore data seeding from local files...');
  const { adminDb: db } = await getFirebaseAdmin();

  // Step 1: Clear pending jobs (this could also be extracted)
  const jobsRef = db.collection('jobs');
  const snapshot = await jobsRef.where('status', '==', 'pending_review').get();
  if (!snapshot.empty) {
    console.log(`Found ${snapshot.size} pending jobs. Starting deletion...`);
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    if (!isDryRun) {
      await batch.commit();
    }
    console.log('Deletion of pending jobs complete.');
  } else {
    console.log('No pending jobs found to delete.');
  }

  // Step 2: Seed sources
  await seedSources(db, isDryRun);

  // Step 3: Seed content from markdown files
  const { allProcessedItems, allUpsertedUrls } = await seedContent(db, isDryRun);

  // Step 4: Notify Google Indexing API
  if (!isDryRun && allUpsertedUrls.length > 0) {
    await notifyBatch(allUpsertedUrls, 'URL_UPDATED');
  }

  // Step 5: Revalidate paths in Next.js
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
      console.log(`- Would delete ${snapshot.size} pending jobs.`);
      console.log(`- Upserted URLs: ${allUpsertedUrls.length}`);
      console.log(`- Paths to Revalidate: ${pathsToRevalidate.length}`);
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

module.exports = { seedFirestore };