import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';
import matter from 'gray-matter';
import pLimit from 'p-limit';
import { metricsCollector } from './utils/metrics.js';
import { getJobSources } from './pipeline.config.jobs.js';
import { writeJobFile, writeBriefingFile } from './writer.js';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../lib/normalization.js';
import { getBriefingSources } from './pipeline.config.briefings.js';
import { createRssSource } from './sources/rss.js';
// --- Configuration ---
const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'scripts', 'archive');
// --- Generic Helper Functions ---
async function getLocalFilePaths(directory, sourceName) {
    const localFiles = new Map();
    try {
        const files = await fs.readdir(directory);
        for (const file of files) {
            if (!file.endsWith('.md'))
                continue;
            const filePath = path.join(directory, file);
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const { data } = matter(fileContent);
                const fileSource = data.source || data.sourceName; // Handle both job and briefing frontmatter
                if (fileSource === sourceName && data.id) {
                    localFiles.set(data.id, filePath);
                }
            }
            catch (readError) {
                console.warn(`[Orchestrator] Warning: Could not read frontmatter for ${file}. Skipping.`, readError);
            }
        }
    }
    catch (error) {
        if (error instanceof Error && error.code !== 'ENOENT') {
            console.warn(`[Orchestrator] Warning: Could not read directory ${directory}.`, error);
        }
    }
    return localFiles;
}
const isDryRun = process.argv.includes('--dry-run');
async function runSource(config) {
    const { source, outputDir, archiveDir, writeFn, getIdFromRawItem } = config;
    console.log(`\n--- Syncing source: ${source.name} ---`);
    metricsCollector.increment('sources.processed');
    try {
        // 1. Fetch all items from the remote source
        console.log(`[Sync] Fetching items from ${source.name}...`);
        const remoteItems = await ('fetchJobs' in source ? source.fetchJobs(source.config) : source.fetchItems());
        const remoteItemIds = new Set();
        const remoteItemMap = new Map();
        for (const rawItem of remoteItems) {
            const id = getIdFromRawItem(rawItem);
            if (id) {
                remoteItemIds.add(id);
                remoteItemMap.set(id, rawItem);
            }
        }
        console.log(`[Sync] Found ${remoteItemIds.size} unique items from source API.`);
        // 2. Get all local files for this source
        const localFilesForSource = await getLocalFilePaths(outputDir, source.name);
        console.log(`[Sync] Found ${localFilesForSource.size} local markdown files for ${source.name}.`);
        // 3. Archive stale local files
        let archivedCount = 0;
        for (const [localId, localPath] of localFilesForSource.entries()) {
            if (!remoteItemIds.has(localId)) {
                if (isDryRun) {
                    console.log(`[DRY RUN] Would archive stale item: ${path.basename(localPath)}`);
                }
                else {
                    const newPath = path.join(archiveDir, path.basename(localPath));
                    await fs.rename(localPath, newPath);
                    console.log(`[Sync] Archived stale item: ${path.basename(localPath)}`);
                }
                metricsCollector.increment('items.archived');
                archivedCount++;
            }
        }
        if (archivedCount > 0)
            console.log(`[Sync] Successfully processed ${archivedCount} stale items for archiving.`);
        // 4. Refresh/create items
        let successCount = 0;
        let errorCount = 0;
        for (const id of remoteItemIds) {
            const rawItem = remoteItemMap.get(id);
            if (!rawItem)
                continue;
            try {
                const transformedItem = source.transform(rawItem);
                if (isDryRun) {
                    console.log(`[DRY RUN] Would write file for item: ${id}`);
                }
                else {
                    await writeFn(transformedItem, id);
                }
                metricsCollector.increment('items.succeeded');
                successCount++;
            }
            catch (transformError) {
                const errorMessage = transformError instanceof Error ? transformError.message : JSON.stringify(transformError);
                console.error(`[Refresh] Error processing item with ID ${id} from ${source.name}: ${errorMessage}`);
                metricsCollector.increment('items.failed');
                errorCount++;
            }
        }
        console.log(`--- Source ${source.name} complete. Processed for writing: ${successCount}, Errors: ${errorCount} ---\n`);
    }
    catch (error) {
        const fetchError = error instanceof Error ? error : new Error(JSON.stringify(error));
        console.error(`[Orchestrator] Failed to run sync for source: ${source.name}`, fetchError);
        metricsCollector.increment('sources.failed');
    }
}
// --- Job-Specific Functions ---
function generateJobHashId(company, title, location) {
    const normalizedCompany = normalizeCompanyName(company);
    const normalizedTitle = normalizeJobTitle(title);
    const normalizedLocation = normalizeLocation(location);
    const combinedString = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;
    return crypto.createHash('sha256').update(combinedString).digest('hex');
}
function getJobIdFromRawItem(rawJob) {
    const typedRawJob = rawJob; // Use the defined interface
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
    console.log('[Orchestrator] Starting JOBS Sync & Refresh pipeline...');
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    const jobSources = await getJobSources();
    const limit = pLimit(5); // Concurrency limit of 5
    const promises = jobSources.map(source => limit(() => runSource({
        source,
        outputDir: JOB_DESCRIPTIONS_DIR,
        archiveDir: ARCHIVE_DIR,
        writeFn: writeJobFile,
        getIdFromRawItem: getJobIdFromRawItem,
    })));
    await Promise.allSettled(promises);
    console.log('\n[Orchestrator] JOBS Sync & Refresh pipeline finished.');
}
async function orchestrateBriefings() {
    console.log('[Orchestrator] Starting BRIEFINGS Sync & Refresh pipeline...');
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    await fs.mkdir(BRIEFINGS_DIR, { recursive: true });
    const sources = await getBriefingSources();
    console.log(`[Orchestrator] Found ${sources.length} briefing sources in Firestore.`);
    const limit = pLimit(5); // Concurrency limit of 5
    const getBriefingIdFromRawItem = (rawItem) => {
        const item = rawItem;
        return crypto.createHash('sha256').update(item.link).digest('hex');
    };
    const promises = sources.map(source => {
        if (source.adapter === 'RSS' && source.feedUrl) {
            const rssSource = createRssSource(source.sourceName, source.feedUrl);
            return limit(() => runSource({
                source: rssSource,
                outputDir: BRIEFINGS_DIR,
                archiveDir: ARCHIVE_DIR,
                writeFn: writeBriefingFile,
                getIdFromRawItem: getBriefingIdFromRawItem,
            }));
        }
        return Promise.resolve(); // Return a resolved promise for non-RSS sources
    });
    await Promise.allSettled(promises);
    console.log('\n[Orchestrator] BRIEFINGS Sync & Refresh pipeline finished.');
}
// --- Main Dispatcher ---
async function main() {
    const pipelineType = process.argv[2];
    console.log(`[Pipeline] Received command: ${pipelineType || 'default'}`);
    switch (pipelineType) {
        case 'jobs':
            await orchestrateJobs();
            break;
        case 'briefings':
            await orchestrateBriefings();
            break;
        default:
            console.log('[Pipeline] No pipeline type specified or type is unknown. Defaulting to "jobs".');
            await orchestrateJobs();
            break;
    }
    console.log(metricsCollector.getSummary());
}
main().catch(error => {
    console.error('[Orchestrator] A critical error occurred during pipeline execution:', error);
    process.exit(1);
});
