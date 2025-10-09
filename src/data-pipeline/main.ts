import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';
import matter from 'gray-matter';
import pLimit from 'p-limit';
import { metricsCollector } from './utils/metrics.js';
import logger from './utils/logger.js';

// Job-specific imports
import { IJobSource, StandardJob } from './types.js';
import { getJobSources } from './pipeline.config.jobs.js';
import { writeJobFile, writeBriefingFile } from './writer.js';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../lib/normalization.js';

// Briefing-specific imports
import { IBriefingSource, StandardBriefing } from './types.js';
import { getBriefingSources } from './pipeline.config.briefings.js';
import { createRssSource } from './sources/rss.js';
import { Source } from '../lib/types.js'; // This is the type from Firestore
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
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const { data } = matter(fileContent);

                const fileSource = data.source || data.sourceName; // Handle both job and briefing frontmatter

                if (fileSource === sourceName && data.id) {
                    localFiles.set(data.id, filePath);
                }
            } catch (readError) {
                logger.warn({ err: readError, file }, `[Orchestrator] Could not read frontmatter for file. Skipping.`);
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
    writeFn: (item: T, id: string) => Promise<void>;
    getIdFromRawItem: (rawItem: unknown) => string;
}

async function runSource<T extends StandardJob | StandardBriefing>(config: SourceRunnerConfig<T>) {
    const { source, outputDir, archiveDir, writeFn, getIdFromRawItem } = config;
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
            }
        }
        sourceLogger.info({ success: successCount, failed: errorCount }, `--- Source complete ---`);

    } catch (error) {
        sourceLogger.error({ err: error }, `[Orchestrator] Failed to run sync for source.`);
        metricsCollector.increment('sources.failed');
    }
}


// --- Job-Specific Functions ---

function generateJobHashId(company: string, title: string, location:string): string {
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedTitle = normalizeJobTitle(title);
  const normalizedLocation = normalizeLocation(location);
  const combinedString = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

interface RawJobForId {
    v5_processed_job_data?: {
        company_name?: string;
        formatted_workplace_location?: string;
    };
    job_information?: {
        title?: string;
    };
    company_name?: string;
    title?: string;
    location?: string;
}

function getJobIdFromRawItem(rawJob: unknown): string {
    const typedRawJob = rawJob as RawJobForId; // Use the defined interface
    const rawJobCompany = typedRawJob.v5_processed_job_data?.company_name || typedRawJob.company_name;
    const rawJobTitle = typedRawJob.job_information?.title || typedRawJob.title;
    const rawJobLocation = typedRawJob.v5_processed_job_data?.formatted_workplace_location || typedRawJob.location;
    if (rawJobCompany && rawJobTitle && rawJobLocation) {
        return generateJobHashId(rawJobCompany, rawJobTitle, rawJobLocation);
    }
    return '';
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

    const sources = await getBriefingSources();
    logger.info({ count: sources.length }, `[Orchestrator] Found briefing sources in Firestore.`);

    const limit = pLimit(5); // Concurrency limit of 5

    const getBriefingIdFromRawItem = (rawItem: unknown) => {
        const item = rawItem as RssItem;
        return crypto.createHash('sha256').update(item.link).digest('hex');
    };

    const promises = sources.map(source => {
        if (source.adapter === 'RSS' && source.feedUrl) {
            const rssSource = createRssSource(source.sourceName, source.feedUrl);
            return limit(() => 
                runSource<StandardBriefing>({
                    source: rssSource,
                    outputDir: BRIEFINGS_DIR,
                    archiveDir: ARCHIVE_DIR,
                    writeFn: writeBriefingFile,
                    getIdFromRawItem: getBriefingIdFromRawItem,
                })
            );
        }
        return Promise.resolve(); // Return a resolved promise for non-RSS sources
    });

    await Promise.allSettled(promises);

    logger.info('[Orchestrator] BRIEFINGS Sync & Refresh pipeline finished.');
}


// --- Main Dispatcher ---

async function main() {
    const pipelineType = process.argv[2] || 'default';
    logger.info({ pipelineType }, `[Pipeline] Received command.`);

    switch (pipelineType) {
        case 'jobs':
            await orchestrateJobs();
            break;
        case 'briefings':
            await orchestrateBriefings();
            break;
        default:
            logger.info('[Pipeline] No pipeline type specified or type is unknown. Defaulting to "jobs".');
            await orchestrateJobs();
            break;
    }

    logger.info({ metrics: metricsCollector.getMetricsObject() }, '[Pipeline] Final metrics summary.');
}

main().catch(error => {
  logger.fatal({ err: error }, '[Orchestrator] A critical error occurred during pipeline execution.');
  process.exit(1);
});
