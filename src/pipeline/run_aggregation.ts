import { parseRssFeed } from './adapters/rss-adapter.js';
import { fetchHiringCafeJobs } from './adapters/hiring-cafe-adapter.js';
import { fetchHiringCafeApiJobs } from './adapters/hiring-cafe-api-adapter.js';
import { generateUniqueId } from './utils.js';
import { getFirebaseAdmin, admin } from '../lib/firebaseAdmin.js';
import { Source } from '../lib/types.js';

async function main() {
  const { adminDb: db } = await getFirebaseAdmin();
  console.log('Starting aggregation pipeline...');

  interface PipelineError {
    source: string;
    error: string;
  }

  const runId = db.collection('pipeline_runs').doc().id;
  const log = {
    runId,
    timestamp: new Date(),
    status: 'In Progress',
    feedsProcessed: 0,
    itemsAdded: 0,
    errors: [] as PipelineError[],
  };

  try {
    const sourcesSnapshot = await db.collection('sources').get();
    const sources = sourcesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
      id: doc.id, // Include the document ID
      ...doc.data()
    })) as Source[];

    for (const source of sources) {
      if (source.status !== 'Pending') {
          continue;
      }
      
      log.feedsProcessed++;
      console.log(`Processing source: ${source.sourceName}`);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let items: any[] = [];
        const adapter = source.adapter;
        const type = source.type;

        switch (adapter) {
          case 'RSS':
          case 'RSS_HUB':
            items = await parseRssFeed(source.feedUrl);
            break;
          case 'HIRING_CAFE':
            items = await fetchHiringCafeJobs();
            break;
          case 'HIRING_CAFE_API':
            if (!source.keywords) {
              throw new Error('Source with HIRING_CAFE_API adapter is missing a `keywords` field.');
            }
            items = await fetchHiringCafeApiJobs(source.keywords);
            break;
          default:
            console.warn(`Unknown adapter type: ${adapter}`);
            continue;
        }
        
        const itemsWithIds = items.map(item => ({
          ...item,
          id: generateUniqueId(item),
        }));

        console.log(`  > Found ${itemsWithIds.length} items.`);

        if (itemsWithIds.length > 0) {
          const collectionName =
            type === 'Job'
              ? 'jobs'
              : adapter === 'RSS' || adapter === 'RSS_HUB'
              ? 'aggregatedArticles'
              : 'articles';
          const collectionRef = db.collection(collectionName);
          const batch = db.batch();

          for (const item of itemsWithIds) {
            const docRef = collectionRef.doc(item.id);
            // Set status to 'published' for ingested aggregated articles
            const itemToSave = { ...item, status: 'published' };
            batch.set(docRef, itemToSave, { merge: true });
          }

          await batch.commit();
          log.itemsAdded += itemsWithIds.length;
          console.log(`  > Saved ${itemsWithIds.length} items to Firestore collection: ${collectionName}`);

          // Update source status to 'Active' after successful processing
          if (source.id) { // Ensure source has an ID before attempting to update
            const sourceDocRef = db.collection('sources').doc(source.id);
            await sourceDocRef.update({ status: 'Active' });
            console.log(`  > Updated source '${source.sourceName}' status to 'Active'.`);
          } else {
            console.warn(`  > Could not update status for source '${source.sourceName}' because it has no ID.`);
          }
        }

      } catch (error) {
        let message = 'Unknown error';
        if (error instanceof Error) {
            message = error.message;
        }
        console.error(`  > Failed to process source ${source.sourceName}:`, error);
        log.errors.push({ 
          source: source.sourceName, 
          error: message
        });
      }
    }
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
        message = error.message;
    }
    console.error('Aggregation pipeline failed catastrophically:', error);
    log.status = 'Failure';
    log.errors.push({ source: 'Pipeline', error: message });
  } finally {
    if (log.status !== 'Failure') {
      log.status = log.errors.length === 0 ? 'Success' : 'Partial Success';
    }
    await db.collection('pipeline_runs').doc(log.runId).set(log);
    console.log(`Aggregation pipeline finished with status: ${log.status}. Log saved with runId: ${log.runId}`);
  }
}

main().catch(console.error);
