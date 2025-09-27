import { parseRssFeed } from './adapters/rss-adapter.js';
import { fetchHiringCafeJobs } from './adapters/hiring-cafe-adapter.js';
import { fetchHiringCafeApiJobs } from './adapters/hiring-cafe-api-adapter.js';
import { generateUniqueId } from './utils.js';
import { getInitializedDb } from '../lib/firebaseAdmin.js';
import { Source } from '../lib/types.js';

async function main() {
  const db = await getInitializedDb();
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
    const sources = sourcesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data()) as Source[];

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
          const collectionName = type === 'Job' ? 'jobs' : 'articles';
          const collectionRef = db.collection(collectionName);
          const batch = db.batch();

          for (const item of itemsWithIds) {
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item, { merge: true });
          }

          await batch.commit();
          log.itemsAdded += itemsWithIds.length;
          console.log(`  > Saved ${itemsWithIds.length} items to Firestore collection: ${collectionName}`);
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
