
import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger.js';
import { sanitizeForFilePath } from './sanitization.js';

const DLQ_DIR = path.resolve(process.cwd(), 'data', 'dead-letter-queue');

interface EnrichedDlqItem {
  failedAt: string;
  source: string;
  type: 'job' | 'briefing';
  error: {
    message: string;
    stack?: string;
  };
  retryCount: number;
  rawItem: unknown;
}

/**
 * Writes a failed raw item to the Dead Letter Queue for later analysis.
 * This function is designed to be completely self-contained and never throw,
 * to avoid crashing the main pipeline.
 *
 * @param sourceName The name of the source the item came from.
 * @param itemId A unique identifier for the item (for the filename).
 * @param itemToDlq The original, unprocessed item from the source.
 * @param error The error object that was thrown during transformation.
 * @param type The type of the item being processed.
 */
export async function writeToDlq(
  sourceName: string,
  itemId: string,
  itemToDlq: unknown,
  error: unknown,
  type: 'job' | 'briefing'
): Promise<void> {
  try {
    const err = error instanceof Error ? error : new Error(String(error));

    // Check if the item is already a DLQ item to handle retries
    const isRetry = typeof itemToDlq === 'object' && itemToDlq !== null && 'retryCount' in itemToDlq;
    
    const originalRawItem = isRetry ? (itemToDlq as EnrichedDlqItem).rawItem : itemToDlq;
    const currentRetryCount = isRetry ? (itemToDlq as EnrichedDlqItem).retryCount : 0;

    const item: EnrichedDlqItem = {
      failedAt: new Date().toISOString(),
      source: sourceName,
      type: type,
      error: {
        message: err.message,
        stack: err.stack,
      },
      retryCount: currentRetryCount + 1,
      rawItem: originalRawItem,
    };

    const safeSourceName = sanitizeForFilePath(sourceName);
    const sourceDlqDir = path.join(DLQ_DIR, safeSourceName);
    await fs.mkdir(sourceDlqDir, { recursive: true });

    // Sanitize the ID to make it a valid filename
    const safeItemId = itemId.replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${safeItemId}.json`;
    const filePath = path.join(sourceDlqDir, filename);

    await fs.writeFile(filePath, JSON.stringify(item, null, 2), 'utf-8');

    logger.warn({ source: sourceName, file: filename }, `[DLQ] Wrote failed item to Dead Letter Queue.`);

  } catch (dlqError) {
    logger.error(
      { 
        err: dlqError, 
        originalItemId: itemId, 
        originalError: error 
      },
      `[DLQ] CRITICAL: Failed to write to Dead Letter Queue. The following item data is at risk of being lost.`
    );
  }
}
