
import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';
import { fetchAndParseRss } from '../src/data-pipeline/adapters/rss-adapter.js';
import type { Source } from '../src/lib/types.js';
import process from 'process';

async function getSampleBriefingUrl() {
  const args = process.argv.slice(2);
  const sourceName = args[0];

  if (!sourceName) {
    console.error('Usage: ts-node scripts/get-sample-briefing-url.ts <SourceName>');
    process.exit(1);
  }

  console.log(`--- Getting sample URL for source: ${sourceName} ---`);

  const { adminDb } = await getFirebaseAdmin();
  const sourcesSnapshot = await adminDb.collection('sources').where('sourceName', '==', sourceName).get();

  if (sourcesSnapshot.empty) {
    console.error(`Error: Source '${sourceName}' not found in Firestore.`);
    process.exit(1);
  }

  const source = sourcesSnapshot.docs[0].data() as Source;

  if (source.adapter !== 'RSS' || !source.feedUrl) {
    console.error(`Error: Source '${sourceName}' is not an RSS feed or is missing a feedUrl.`);
    process.exit(1);
  }

  try {
    const items = await fetchAndParseRss(source.feedUrl);
    if (items.length > 0) {
      console.log('Sample URL:', items[0].link);
    } else {
      console.log('No items found in the RSS feed.');
    }
  } catch (error) {
    console.error(`Error fetching RSS feed for ${sourceName}:`, error);
    process.exit(1);
  }
}

getSampleBriefingUrl().catch(error => {
  console.error('A critical error occurred:', error);
  process.exit(1);
});
