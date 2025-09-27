import { getFirebaseAdmin } from '../lib/firebaseAdmin.js';

async function addHiringCafeSource() {
  console.log('Adding Hiring.cafe API source...');

  const { adminDb } = await getFirebaseAdmin();

  const sourceData = {
    status: 'Pending',
    type: 'Job',
    adapter: 'HIRING_CAFE_API',
    sourceName: 'Hiring.cafe API',
    feedUrl: 'AI',
    notes: 'Fetched via Hiring.cafe API',
  };

  try {
    const docRef = await adminDb.collection('sources').add(sourceData);
    console.log(`Successfully added Hiring.cafe API source with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error adding Hiring.cafe API source:', error);
  }
}

addHiringCafeSource().catch(console.error);
