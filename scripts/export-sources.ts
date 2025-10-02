import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.ts';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * This script fetches all documents from the 'sources' collection in Firestore
 * and saves them to a local JSON file, making the configuration version-controllable.
 */
async function exportSources() {
  console.log("Connecting to Firebase...");
  const { adminDb } = await getFirebaseAdmin();
  console.log("Connection successful. Fetching sources...");

  const sourcesCollection = adminDb.collection('sources');
  const snapshot = await sourcesCollection.get();

  if (snapshot.empty) {
    console.log("No sources found in the collection. Exiting.");
    return;
  }

  const sourcesData = snapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for clean JSON serialization
    if (data.lastFetchedAt && typeof data.lastFetchedAt.toDate === 'function') {
      data.lastFetchedAt = data.lastFetchedAt.toDate().toISOString();
    }
    return data;
  });

  console.log(`Found ${sourcesData.length} sources.`);

  const outputPath = path.resolve(process.cwd(), 'src', 'config', 'sources.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sourcesData, null, 2), 'utf-8');

  console.log(`Successfully exported sources to: ${outputPath}`);
}

exportSources().catch(error => {
  console.error("An error occurred during the export process:", error);
  process.exit(1);
});
