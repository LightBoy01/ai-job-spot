
import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

async function fixSourceUrls() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(isDryRun ? '--- Running in DRY-RUN mode ---' : '--- Running in LIVE mode ---');

  const { adminDb } = await getFirebaseAdmin();
  const sourcesCollection = adminDb.collection('sources');
  const batch = adminDb.batch();
  let fixesCount = 0;

  try {
    console.log('Fetching all documents from the "sources" collection...');
    const snapshot = await sourcesCollection.get();

    if (snapshot.empty) {
      console.log('No sources found. Exiting.');
      return;
    }

    console.log(`Found ${snapshot.docs.length} documents to check.`);

    snapshot.forEach(doc => {
      const sourceData = doc.data();
      const originalUrl = sourceData.feedUrl;

      if (originalUrl && typeof originalUrl === 'string' && originalUrl.endsWith(')')) {
        const correctedUrl = originalUrl.slice(0, -1);
        console.log(`[FIX] Planning to change "${originalUrl}" to "${correctedUrl}" for doc ID: ${doc.id}`);
        
        const docRef = sourcesCollection.doc(doc.id);
        batch.update(docRef, { feedUrl: correctedUrl });
        fixesCount++;
      }
    });

    if (fixesCount === 0) {
      console.log('No URLs with trailing parentheses found. Nothing to do.');
      return;
    }

    console.log(`
Found ${fixesCount} URLs to correct.`);

    if (!isDryRun) {
      console.log('Committing changes to Firestore...');
      await batch.commit();
      console.log('Successfully committed all updates.');
    } else {
      console.log('Dry run complete. No changes were made to the database.');
    }

  } catch (error) {
    console.error('An error occurred while fixing source URLs:', error);
    process.exit(1);
  }
}

fixSourceUrls()
  .then(() => {
    console.log('\nScript finished successfully.');
    process.exit(0);
  })
  .catch(() => {
    // Error is already logged in the function
    process.exit(1);
  });
