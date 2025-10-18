import { promises as fs } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import pLimit from 'p-limit';
import { metricsCollector } from './utils/metrics.js';
import logger from './utils/logger.js';

import { writeToDlq } from './utils/dlq.js';
import { getJobIdFromRawItem, generateBriefingId } from './utils/id-generation.js';
import { IJobSource, StandardJob } from './types.js';
import { getJobSources } from './pipeline.config.jobs.js';
import { writeJobFile, writeBriefingFile } from './writer.js';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../lib/normalization.js';

// Briefing-specific imports
import { IBriefingSource, StandardBriefing } from './types.js';
import { getBriefingSources } from './pipeline.config.briefings.js';
import { RssItem } from './adapters/rss-adapter.js';

// --- Configuration ---
const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'scripts', 'archive');

// --- Generic Helper Functions ---

async function getLocalFilePaths(directory: string, sourceName: string): Promise<Map<string, string>> {
    const localFiles = new Map<string, string>();
    try {
        const files = await fs.readdir(directory);
        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const filePath = path.join(directory, file);
            let filehandle;
            try {
                // Read only the first 1024 bytes to capture the frontmatter
                filehandle = await fs.open(filePath, 'r');
                const buffer = Buffer.alloc(1024);
                const { bytesRead } = await filehandle.read(buffer, 0, 1024, 0);
                const fileContent = buffer.toString('utf-8', 0, bytesRead);

                const { data } = matter(fileContent);

                const fileSource = data.source || data.sourceName; // Handle both job and briefing frontmatter

                if (fileSource === sourceName && data.id) {
                    localFiles.set(data.id, filePath);
                }
            } catch (readError) {
                logger.warn({ err: readError, file }, `[Orchestrator] Could not read frontmatter for file. Skipping.`);
            } finally {
                await filehandle?.close();
            }
        }
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logger.warn({ err: error, directory }, `[Orchestrator] Could not read directory.`);
        }
    }
    return localFiles;
}




const isDryRun = process.argv.includes('--dry-run');

// --- The New Generic Runner ---

interface SourceRunnerConfig<T> {
    source: IJobSource | IBriefingSource;
    outputDir: string;
    archiveDir: string;
    type: 'job' | 'briefing';
    writeFn: (item: T, id: string) => Promise<void>;
    getIdFromRawItem: (rawItem: unknown) => string;
}

async function runSource<T extends StandardJob | StandardBriefing>(config: SourceRunnerConfig<T>) {
    const { source, outputDir, archiveDir, type, writeFn, getIdFromRawItem } = config;
    const sourceLogger = logger.child({ source: source.name });
    
    sourceLogger.info(`--- Syncing source ---`);
    metricsCollector.increment('sources.processed');

    try {
        // 1. Fetch all items from the remote source
        sourceLogger.info(`[Sync] Fetching items...`);
        const remoteItems = await ('fetchJobs' in source ? source.fetchJobs(source.config) : source.fetchItems());

        const remoteItemIds = new Set<string>();
        const remoteItemMap = new Map<string, unknown>();

        for (const rawItem of remoteItems) {
            const id = getIdFromRawItem(rawItem);
            if (id) {
                remoteItemIds.add(id);
                remoteItemMap.set(id, rawItem);
            }
        }
        sourceLogger.info({ count: remoteItemIds.size }, `[Sync] Found unique items from source API.`);

        // 2. Get all local files for this source
        const localFilesForSource = await getLocalFilePaths(outputDir, source.name);
        sourceLogger.info({ count: localFilesForSource.size }, `[Sync] Found local markdown files.`);

        // 3. Archive stale local files
        let archivedCount = 0;
        for (const [localId, localPath] of localFilesForSource.entries()) {
            if (!remoteItemIds.has(localId)) {
                const fileName = path.basename(localPath);
                if (isDryRun) {
                    logger.info({ file: fileName }, `[DRY RUN] Would archive stale item.`);
                } else {
                    const newPath = path.join(archiveDir, fileName);
                    await fs.rename(localPath, newPath);
                    sourceLogger.info({ file: fileName }, `[Sync] Archived stale item.`);
                }
                metricsCollector.increment('items.archived');
                archivedCount++;
            }
        }
        if (archivedCount > 0) sourceLogger.info({ count: archivedCount }, `[Sync] Successfully processed stale items for archiving.`);

        // 4. Refresh/create items
        let successCount = 0;
        let errorCount = 0;

        for (const id of remoteItemIds) {
            const rawItem = remoteItemMap.get(id);
            if (!rawItem) continue;

            try {
                const transformedItem = source.transform(rawItem) as T;
                if (!transformedItem) {
                    continue;
                }
                if (isDryRun) {
                    logger.info({ itemId: id }, `[DRY RUN] Would write file for item.`);
                } else {
                    await writeFn(transformedItem, id);
                }
                metricsCollector.increment('items.succeeded');
                successCount++;
            } catch (transformError: unknown) {
                sourceLogger.error({ err: transformError, itemId: id }, `[Refresh] Error processing item.`);
                metricsCollector.increment('items.failed');
                errorCount++;
                // Write the failed item to the Dead Letter Queue
                await writeToDlq(source.name, id, rawItem, transformError, type);
            }
        }
        sourceLogger.info({ success: successCount, failed: errorCount }, `--- Source complete ---`);

    } catch (error) {
        sourceLogger.error({ err: error }, `[Orchestrator] Failed to run sync for source.`);
        metricsCollector.increment('sources.failed');
    }
}





// --- Orchestrators ---

export async function orchestrateJobs() {
  logger.info('[Orchestrator] Starting JOBS Sync & Refresh pipeline...');
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const jobSources = await getJobSources();
  const limit = pLimit(5); // Concurrency limit of 5

  const promises = jobSources.map(source => 
    limit(() => 
        runSource<StandardJob>({
            source,
            outputDir: JOB_DESCRIPTIONS_DIR,
            archiveDir: ARCHIVE_DIR,
            type: 'job',
            writeFn: writeJobFile,
            getIdFromRawItem: getJobIdFromRawItem,
        })
    )
  );

  await Promise.allSettled(promises);

  logger.info('[Orchestrator] JOBS Sync & Refresh pipeline finished.');
}

async function orchestrateBriefings() {
    logger.info('[Orchestrator] Starting BRIEFINGS Sync & Refresh pipeline...');
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    await fs.mkdir(BRIEFINGS_DIR, { recursive: true });

    const briefingSources = await getBriefingSources();
    logger.info({ count: briefingSources.length }, `[Orchestrator] Found briefing sources.`);

    const limit = pLimit(5);

    const promises = briefingSources.map(source =>
        limit(() =>
            runSource<StandardBriefing>({
                source,
                outputDir: BRIEFINGS_DIR,
                archiveDir: ARCHIVE_DIR,
                type: 'briefing',
                writeFn: writeBriefingFile,
                getIdFromRawItem: (rawItem: unknown) => {
                    // The rawItem is now a validated RssItem from the adapter
                    const item = rawItem as RssItem;
                    return generateBriefingId(item.link);
                },
            })
        )
    );

    await Promise.allSettled(promises);

    logger.info('[Orchestrator] BRIEFINGS Sync & Refresh pipeline finished.');
}


// --- Main Dispatcher ---

async function main() {
    const args = process.argv.slice(2);
    let pipelineType = 'jobs'; // Default to jobs

    if (args.includes('briefings')) {
        pipelineType = 'briefings';
    } 

    logger.info({ pipelineType, args }, `[Pipeline] Received command.`);

    switch (pipelineType) {
        case 'jobs':
            await orchestrateJobs();
            break;
        case 'briefings':
            await orchestrateBriefings();
            break;
    }

    logger.info({ metrics: metricsCollector.getMetricsObject() }, '[Pipeline] Final metrics summary.');
}

main().catch(error => {
  logger.fatal({ err: error }, '[Orchestrator] A critical error occurred during pipeline execution.');
  process.exit(1);
});
