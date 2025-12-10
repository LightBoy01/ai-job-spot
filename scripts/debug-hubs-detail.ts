
import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

async function debugHubsDetail() {
  const { adminDb } = await getFirebaseAdmin();
  // Check 'Mental Models & Frameworks' specifically
  const hubName = 'mental models & frameworks';
  console.log(`Querying for hub: "${hubName}"`);

  const snapshot = await adminDb.collection('articles')
    .where('hub', '==', hubName)
    .get();

  console.log(`Found ${snapshot.size} articles for hub "${hubName}".`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`- ${doc.id}: status="${data.status}", publishDate=${data.publishDate ? data.publishDate.toDate().toISOString() : 'null'}`);
  });
}

debugHubsDetail().catch(console.error);
