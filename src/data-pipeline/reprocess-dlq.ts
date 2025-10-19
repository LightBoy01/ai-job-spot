
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from './utils/logger.js';
import { IJobSource, IBriefingSource, StandardJob, StandardBriefing } from './types.js';
import { getJobSources } from './pipeline.config.jobs.js';
import { getBriefingSources } from './pipeline.config.briefings.js';
import { getJobIdFromRawItem } from './utils/id-generation.js';
import { writeJobFile, writeBriefingFile } from './writer.js';
import { writeToDlq } from './utils/dlq.js';
import { createRssSource } from './sources/rss.js';
import { RssItem } from './adapters/rss-adapter.js';
import { sanitizeForFilePath } from './utils/sanitization.js';

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
    let files: string[] = [];
    try {
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
    const sourceName = process.argv[2];
    if (!sourceName) {
        logger.fatal('[Reprocess] A source name must be provided as an argument. Ex: `npm run pipeline:reprocess-dlq hiring.cafe`');
        process.exit(1);
    }

    // Sanitize the input from the command line before using it.
    const safeSourceName = sanitizeForFilePath(sourceName);
    await reprocessDlqForSource(safeSourceName);
}

main().catch(error => {
    logger.fatal({ err: error }, '[Reprocess] A critical error occurred during DLQ reprocessing.');
    process.exit(1);
});