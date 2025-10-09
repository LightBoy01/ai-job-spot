
import { getFirebaseAdmin } from '../lib/firebaseAdmin.js';
import { z } from 'zod';
import { IJobSource } from './types.js';
import logger from './utils/logger.js';

// Import all possible source adapters
import { hiringCafeSource } from './sources/hiringCafe.js';

/**
 * A factory to map the adapter name from Firestore to the actual source implementation.
 * This is crucial for dynamically constructing the pipeline.
 */
const sourceAdapterFactory: { [key: string]: IJobSource } = {
  'HiringCafe': hiringCafeSource,
  // To add a new source type, import its adapter and add it here.
  // 'YourNewSource': yourNewSourceAdapter,
};

type AdapterName = string; // Temporarily bypass Zod enum issues

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
export async function getJobSources(): Promise<IJobSource[]> {
  logger.info('[Config] Fetching dynamic job sources from Firestore...');
  const { adminDb } = await getFirebaseAdmin();
  const sourcesSnapshot = await adminDb.collection('job-sources').where('enabled', '==', true).get();

  if (sourcesSnapshot.empty) {
    logger.warn('[Config] No enabled job sources found in Firestore.');
    return [];
  }

  const sources: IJobSource[] = [];
  for (const doc of sourcesSnapshot.docs) {
    const docData = doc.data();
    const validationResult = JobSourceConfigSchema.safeParse(docData);

    if (!validationResult.success) {
      logger.error({ err: validationResult.error, docId: doc.id }, `[Config] Invalid job source configuration. Skipping.`);
      continue;
    }

    const configData = validationResult.data;
    const adapterName = configData.adapter as AdapterName;
    const sourceAdapter = sourceAdapterFactory[adapterName]; // Type assertion removed due to AdapterName being string

    if (!sourceAdapter) {
      logger.error({ adapterName, docId: doc.id }, `[Config] No adapter found for name. Skipping.`);
      continue;
    }

    // Merge the database config into the source adapter to create the final source object
    const finalSource: IJobSource = {
      ...sourceAdapter,
      // The config from the DB overrides any default config in the adapter
      config: {
        ...(sourceAdapter.config || {}),
        ...configData.config,
      },
    };
    
    sources.push(finalSource);
  }

  logger.info({ count: sources.length }, `[Config] Successfully loaded and validated job sources.`);
  return sources;
}
