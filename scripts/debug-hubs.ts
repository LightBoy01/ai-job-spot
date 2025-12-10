
import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

async function debugHubs() {
  const { adminDb } = await getFirebaseAdmin();
  const snapshot = await adminDb.collection('articles').get();
  
  const hubs = new Set();
  const articlesWithoutHub: string[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.hub) {
      hubs.add(data.hub);
    } else {
      articlesWithoutHub.push(doc.id);
    }
  });

  console.log('--- Hubs found in Firestore ---');
  Array.from(hubs).forEach(hub => console.log(`"${hub}"`));
  
  console.log('\n--- Articles without Hub ---');
  console.log(`Count: ${articlesWithoutHub.length}`);
  if (articlesWithoutHub.length > 0) {
      console.log('IDs:', articlesWithoutHub.slice(0, 5), '...');
  }
}

debugHubs().catch(console.error);
