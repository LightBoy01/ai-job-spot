/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirebaseAdmin, admin } from '../src/lib/firebaseAdmin.js';
import { z } from 'zod';
import { articleSchema, jobSchema } from '../src/lib/schemas.js';
import dotenv from 'dotenv';
import path from 'path';
import { calculateArticleCompleteness, calculateJobCompleteness } from '../src/lib/completenessScore.js';

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

type Article = z.infer<typeof articleSchema>;
type Job = z.infer<typeof jobSchema>;

const BATCH_SIZE = 100;
const isDryRun = process.argv.includes('--dry-run');

async function backfillCollection(
  collectionName: 'articles' | 'jobs',
  calculateScore: (item: Article | Job) => number // Use specific types
) {
  const { adminDb } = await getFirebaseAdmin();
  const collectionRef = adminDb.collection(collectionName);
  let updatedCount = 0;

  console.log(`Starting backfill for "${collectionName}" collection...`);

  let lastVisible: admin.firestore.DocumentSnapshot | null = null;
  let totalProcessed = 0;

  while (true) {
    let query: admin.firestore.Query = collectionRef;

    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }
    query = query.limit(BATCH_SIZE);
      
    const snapshot: admin.firestore.QuerySnapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const currentScore = data.completenessScore;
      const newScore = calculateScore(data as any); // Cast to any to match calculateScore signature
      
      // Only update if the score has changed to avoid unnecessary writes
      if (currentScore === undefined || currentScore !== newScore) {
        if (isDryRun) {
          console.log(`[DRY RUN] Would update ${collectionName}/${doc.id}: oldScore=${currentScore}, newScore=${newScore}`);
        } else {
          batch.update(doc.ref, { completenessScore: newScore });
          updatedCount++;
        }
      }
    });

    if (!isDryRun) {
      await batch.commit();
    }
    totalProcessed += snapshot.size;
    console.log(`  ... processed ${totalProcessed} documents from "${collectionName}".`);
    lastVisible = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(
    `Backfill for "${collectionName}" complete. ${isDryRun ? '[DRY RUN]' : ''} Updated ${updatedCount} documents.`
  );
}

async function main() {
  if (isDryRun) {
    console.log('*** RUNNING IN DRY-RUN MODE. NO CHANGES WILL BE MADE TO THE DATABASE. ***\n');
  } else {
    console.log('*** WARNING: RUNNING IN LIVE MODE. ALL CHANGES WILL BE WRITTEN TO THE DATABASE. ***\n');
  }

  try {
    await backfillCollection('articles', calculateArticleCompleteness as (item: Article | Job) => number);
    await backfillCollection('jobs', calculateJobCompleteness as (item: Article | Job) => number);
    console.log('\nAll collections have been successfully backfilled!');
  } catch (error) {
    console.error('An error occurred during the backfill process:', error);
    process.exit(1);
  }
}

// --- EXECUTION BLOCK ---
if (process.env.NODE_ENV !== 'test') {
  main()
    .then(() => {
      console.log('\nBackfill process completed successfully.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nBackfill process failed.\n', error);
      process.exit(1);
    });
}
