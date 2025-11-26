
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from './utils/logger.js';
import { StandardJob, StandardBriefing } from './types.js';
import { RssItem } from './adapters/rss-adapter.js';
import { sanitizeForFilePath } from './utils/sanitization.js';
import { getJobSources } from './pipeline.config.jobs.js';
import { getBriefingSources } from './pipeline.config.briefings.js';
import { getJobIdFromRawItem } from './utils/id-generation.js';
import { writeJobFile, writeBriefingFile } from './writer.js';
import { writeToDlq } from './utils/dlq.js';

const DLQ_DIR = path.resolve(process.cwd(), 'data', 'dead-letter-queue');
const MAX_RETRIES = 3;

// Define the structure of the DLQ item, including the new 'type' field.
interface DlqItem {
    source: string;
    type: 'job' | 'briefing';
    retryCount: number;
    rawItem: unknown;
}

async function reprocessDlqForSource(sourceName: string) {
    logger.info({ source: sourceName }, `[Reprocess] Starting DLQ reprocessing for source.`);

    // 1. Fetch all possible source configurations upfront.
    const jobSources = await getJobSources();
    const briefingSourceConfigs = await getBriefingSources();

    const safeSourceName = sanitizeForFilePath(sourceName);
    const sourceDlqDir = path.join(DLQ_DIR, safeSourceName);

    // Security: Ensure the constructed DLQ path is within the main DLQ directory
    if (!path.resolve(sourceDlqDir).startsWith(path.resolve(DLQ_DIR))) {
        logger.fatal({ sourceDlqDir }, `[Reprocess] Invalid source name resulted in path traversal attempt. Aborting.`);
        process.exit(1);
    }

    let files: string[] = [];
    try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated above
        files = await fs.readdir(sourceDlqDir);
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.info({ source: sourceName }, `[Reprocess] No DLQ directory found for source. Nothing to reprocess.`);
            return;
        }
        throw error;
    }

    if (files.length === 0) {
        logger.info({ source: sourceName }, `[Reprocess] DLQ is empty. Nothing to reprocess.`);
        return;
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const filePath = path.join(sourceDlqDir, file);

        // Security: Ensure the file path is within the source-specific DLQ directory
        if (!path.resolve(filePath).startsWith(path.resolve(sourceDlqDir))) {
            logger.warn({ filePath }, `[Reprocess] Detected potential path traversal for file. Skipping.`);
            continue;
        }

        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated above
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const dlqItem = JSON.parse(fileContent) as DlqItem;

        if (dlqItem.retryCount >= MAX_RETRIES) {
            logger.warn({ source: sourceName, item: dlqItem }, `[Reprocess] Item has reached max retries. Skipping.`);
            skippedCount++;
            continue;
        }

        try {
            let transformedItem: StandardJob | StandardBriefing | null;
            let id: string;

            // 2. Use a switch on the item type to handle reprocessing dynamically.
            switch (dlqItem.type) {
                case 'job':
                    const jobAdapter = jobSources.find(s => s.name === sourceName);
                    if (!jobAdapter) throw new Error(`No job adapter found for source: ${sourceName}`);
                    
                    transformedItem = jobAdapter.transform(dlqItem.rawItem);
                    if (!transformedItem) break;

                    id = getJobIdFromRawItem(dlqItem.rawItem);
                    await writeJobFile(transformedItem as StandardJob, id);
                    break;

                case 'briefing':
                    const briefingAdapter = briefingSourceConfigs.find(s => s.name === sourceName);
                    if (!briefingAdapter) throw new Error(`No briefing adapter found for source: ${sourceName}`);

                    transformedItem = briefingAdapter.transform(dlqItem.rawItem);
                    if (!transformedItem) break;

                    id = crypto.createHash('sha256').update((dlqItem.rawItem as RssItem).link).digest('hex');
                    await writeBriefingFile(transformedItem as StandardBriefing, id);
                    break;

                default:
                    throw new Error(`Unknown DLQ item type: ${dlqItem.type}`);
            }

            if (!transformedItem) {
                logger.warn({ source: sourceName, item: dlqItem }, `[Reprocess] Transform function returned null. Item may be filtered. Deleting from DLQ.`);
            } else {
                logger.info({ source: sourceName, file }, `[Reprocess] Successfully reprocessed and wrote file.`);
            }

            // Path is already validated at the top of the loop
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated at loop start
            await fs.unlink(filePath);
            successCount++;

        } catch (reprocessError) {
            logger.error({ err: reprocessError, source: sourceName, file }, `[Reprocess] Failed to reprocess item.`);
            const id = file.replace('.json', '');
            // Pass the type back when writing to the DLQ again
            await writeToDlq(sourceName, id, dlqItem, reprocessError, dlqItem.type);
            failedCount++;
        }
    }

    logger.info({ success: successCount, failed: failedCount, skipped: skippedCount }, `[Reprocess] DLQ reprocessing complete for source.`);
}

async function main() {
    logger.info('[Reprocess] Starting DLQ reprocessing for all sources...');
    
    let sourceDirs: string[];
    try {
         
        sourceDirs = await fs.readdir(DLQ_DIR);
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.info('[Reprocess] DLQ directory not found. Nothing to reprocess.');
            return;
        }
        throw error;
    }

    for (const sourceName of sourceDirs) {
        // We can pass the sourceName directly to reprocessDlqForSource, 
        // as it includes its own sanitization and safety checks.
        await reprocessDlqForSource(sourceName);
    }

    logger.info('[Reprocess] Full DLQ reprocessing cycle complete.');
}

main().catch(error => {
    logger.fatal({ err: error }, '[Reprocess] A critical error occurred during DLQ reprocessing.');
    process.exit(1);
});