import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';

async function toggleSourceStatus() {
  const [sourceName, newStatus] = process.argv.slice(2);
  if (!sourceName || !newStatus) {
    console.error('Usage: ts-node scripts/toggle_source_status.ts <SourceName> <NewStatus>');
    process.exit(1);
  }

  console.log(`Attempting to set source '${sourceName}' to status '${newStatus}'...`);
  const { adminDb } = await getFirebaseAdmin();
  const sourcesRef = adminDb.collection('sources');
  const snapshot = await sourcesRef.where('sourceName', '==', sourceName).get();

  if (snapshot.empty) {
    console.error(`Error: No source found with name '${sourceName}'.`);
    process.exit(1);
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach(doc => {
    console.log(`Updating document ${doc.id}...`);
    batch.update(doc.ref, { status: newStatus });
  });

  await batch.commit();
  console.log(`Successfully updated status for '${sourceName}' to '${newStatus}'.`);
}

toggleSourceStatus().catch(console.error).finally(() => process.exit());
