import { getFirebaseAdmin } from '../lib/firebaseAdmin.js';
import { logger } from './utils/logger.js';

import { z } from 'zod';
// Import all possible source adapters
import { hiringCafeSource } from './sources/hiringCafe.js';
/**
 * A factory to map the adapter name from Firestore to the actual source implementation.
 * This is crucial for dynamically constructing the pipeline.
 */
const sourceAdapterFactory = {
    'HiringCafe': hiringCafeSource,
    // To add a new source type, import its adapter and add it here.
    // 'YourNewSource': yourNewSourceAdapter,
};
/**
 * Zod schema for validating the job source configuration fetched from Firestore.
 * This ensures data integrity at runtime.
 */
const JobSourceConfigSchema = z.object({
    name: z.string(),
    adapter: z.string(), // Temporarily bypass Zod enum issues
    enabled: z.boolean(),
    config: z.record(z.string(), z.unknown()).optional(), // Allows for flexible, source-specific config
});
/**
 * Fetches and constructs the job source configurations from Firestore.
 *
 * @returns A promise that resolves to an array of fully configured and validated job sources.
 */
export async function getJobSources() {
    logger.info('[Config] Fetching dynamic job sources from Firestore...');
    const { adminDb } = await getFirebaseAdmin();
    const sourcesSnapshot = await adminDb.collection('job-sources').where('enabled', '==', true).get();
    if (sourcesSnapshot.empty) {
        logger.warn('[Config] No enabled job sources found in Firestore.');
        return [];
    }
    const sources = [];
    for (const doc of sourcesSnapshot.docs) {
        const docData = doc.data();
        const validationResult = JobSourceConfigSchema.safeParse(docData);
        if (!validationResult.success) {
            logger.error(`[Config] Invalid job source configuration for doc '${doc.id}'. Skipping.`, validationResult.error);
            continue;
        }
        const configData = validationResult.data;
        const adapterName = configData.adapter;
        const sourceAdapter = sourceAdapterFactory[adapterName]; // Type assertion removed due to AdapterName being string
        if (!sourceAdapter) {
            logger.error(`[Config] No adapter found for name '${adapterName}' in doc '${doc.id}'. Skipping.`);
            continue;
        }
        // Merge the database config into the source adapter to create the final source object
        const finalSource = {
            ...sourceAdapter,
            // The config from the DB overrides any default config in the adapter
            config: {
                ...(sourceAdapter.config || {}),
                ...configData.config,
            },
        };
        sources.push(finalSource);
    }
    logger.info(`[Config] Successfully loaded and validated ${sources.length} job sources.`);
    return sources;
}
