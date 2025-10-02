import { getFirebaseAdmin, admin } from '../src/lib/firebaseAdmin.ts';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import crypto from 'crypto';
import type { Source } from '../src/lib/types.ts';
import { fetchAndParseRss } from '../src/pipeline/adapters/rss-adapter.ts';
import type { RssItem } from '../src/pipeline/adapters/rss-adapter.ts';

// --- Configuration ---
const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'archive');

/**
 * Generates a unique and consistent ID for a briefing based on its original URL.
 */
function generateBriefingId(originalUrl: string): string {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('hex');
  return `briefing-${hash}`;
}

/**
 * Reads all local briefing files for a specific source to get their ID and file path.
 */
async function getLocalBriefingFilePaths(sourceName: string): Promise<Map<string, string>> {
  const localBriefings = new Map<string, string>();
  try {
    const files = await fs.readdir(BRIEFINGS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);

        if (data.sourceName === sourceName && data.id) {
          localBriefings.set(data.id, filePath);
        }
      } catch (readError) {
        // Ignore files that can't be read
      }
    }
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[Briefings Pipeline] Warning: Could not read briefings directory.`);
    }
  }
  return localBriefings;
}

/**
 * The main orchestration function for the Briefings ingestion pipeline.
 */
async function ingestBriefings() {
  console.log('--- Starting Briefings Ingestion Pipeline ---');
  await fs.mkdir(BRIEFINGS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const { adminDb } = await getFirebaseAdmin();
  const sourcesSnapshot = await adminDb.collection('sources').where('type', '==', 'Article').get();

  if (sourcesSnapshot.empty) {
    console.log('No article sources found in Firestore. Exiting.');
    return;
  }

  const sources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Source));

  for (const source of sources) {
    if (source.status !== 'Active') {
      console.log(`- Skipping source '${source.sourceName}': status is '${source.status}'.`);
      continue;
    }

    // --- Scheduling Logic ---
    if (source.fetchFrequency && source.lastFetchedAt) {
        const now = new Date();
        const lastFetched = (source.lastFetchedAt as any).toDate(); // Convert Firestore Timestamp
        const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);
        let shouldProcess = false;
        switch (source.fetchFrequency) {
            case 'daily':
                if (hoursSinceLastFetch > 24) shouldProcess = true;
                break;
            case 'weekly':
                if (hoursSinceLastFetch > 24 * 7) shouldProcess = true;
                break;
        }
        if (!shouldProcess) {
            console.log(`- Skipping source '${source.sourceName}': not yet due for its ${source.fetchFrequency} update.`);
            continue;
        }
    }

    console.log(`\n[Processing] Source: ${source.sourceName}`);

    try {
      let items: RssItem[] = [];
      switch (source.adapter) {
        case 'RSS':
          if (!source.feedUrl) {
            throw new Error(`Source '${source.sourceName}' is missing a feedUrl for the RSS adapter.`);
          }
          items = await fetchAndParseRss(source.feedUrl);
          break;
        default:
          console.warn(`  - Skipping source '${source.sourceName}': Unknown or unsupported adapter type '${source.adapter}'.`);
          continue;
      }
      console.log(`  > Fetched ${items.length} items from source.`);

      // --- Stateful Diffing and Archiving ---
      const localBriefings = await getLocalBriefingFilePaths(source.sourceName);
      const remoteBriefingIds = new Set(items.map(item => generateBriefingId(item.link)));
      let archivedCount = 0;

      for (const [localId, localPath] of localBriefings.entries()) {
        if (!remoteBriefingIds.has(localId)) {
          const archivePath = path.join(ARCHIVE_DIR, path.basename(localPath));
          await fs.rename(localPath, archivePath);
          archivedCount++;
        }
      }
      if (archivedCount > 0) {
        console.log(`  > Archived ${archivedCount} stale briefing(s).`);
      }

      // --- Process and Write New Items ---
      let createdCount = 0;
      for (const item of items) {
        const briefingId = generateBriefingId(item.link);
        const filePath = path.join(BRIEFINGS_DIR, `${briefingId}.md`);

        try {
          await fs.access(filePath);
          continue; // Skip if file already exists
        } catch (e) {
          // File doesn't exist, proceed
        }

        const frontmatter = {
          id: briefingId,
          title: item.title,
          slug: briefingId,
          author: item.creator || source.sourceName,
          publishDate: item.isoDate ? new Date(item.isoDate) : new Date(),
          contentType: 'briefing',
          sourceName: source.sourceName,
          originalUrl: item.link,
          status: 'pending_review',
          tags: item.categories || [],
          excerpt: item.contentSnippet?.substring(0, 200) || ''
        };

        const fileContent = matter.stringify(item.content || '', frontmatter);
        await fs.writeFile(filePath, fileContent, 'utf-8');
        createdCount++;
      }
      if (createdCount > 0) {
        console.log(`  + Created ${createdCount} new briefing file(s).`);
      }

      // --- Update Source State ---
      await adminDb.collection('sources').doc(source.id).update({ lastFetchedAt: new Date() });
      console.log(`  > Successfully updated lastFetchedAt for source '${source.sourceName}'.`);

    } catch (error) {
      console.error(`! Failed to process source ${source.sourceName}:`, error);
    }
  }

  console.log('\n--- Briefings Ingestion Pipeline Finished ---');
}

ingestBriefings().catch(error => {
  console.error('A critical error occurred during the ingestion pipeline execution:', error);
  process.exit(1);
});
