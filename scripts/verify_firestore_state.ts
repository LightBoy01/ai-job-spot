import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

async function verifyFirestoreState() {
  console.log('Connecting to Firestore...');
  const { adminDb } = await getFirebaseAdmin();
  console.log('Successfully connected. Fetching collections...');

  const collections = await adminDb.listCollections();
  const collectionIds = collections.map(col => col.id);
  console.log('--- Firestore Root Collections ---');
  console.log(collectionIds.join('\n'));
  console.log('----------------------------------\n');

  const collectionsToInspect = ['articles', 'aggregatedArticles', 'jobs', 'sources'];

  for (const collectionId of collectionsToInspect) {
    if (collectionIds.includes(collectionId)) {
      console.log(`--- Inspecting Collection: "${collectionId}" ---`);
      const snapshot = await adminDb.collection(collectionId).limit(1).get();
      if (snapshot.empty) {
        console.log(`  Status: Collection exists but is EMPTY.`);
      } else {
        const doc = snapshot.docs[0];
        console.log(`  Status: Found ${snapshot.size} document(s).`);
        console.log(`  Sample Document ID: ${doc.id}`);
        console.log('  Fields:', JSON.stringify(doc.data(), null, 2));
      }
    } else {
      console.log(`--- Collection "${collectionId}" does NOT exist. ---`);
    }
    console.log('----------------------------------\n');
  }
}

verifyFirestoreState().catch(console.error).finally(() => process.exit());
