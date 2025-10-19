import { getFirebaseAdmin } from '../../lib/firebaseAdmin.js';
import { z } from 'zod';
import logger from './logger.js';
import { Timestamp, WhereFilterOp, Query } from 'firebase-admin/firestore';
import path from 'node:path';

const useLocalConfig = process.argv.includes('--use-local-config');
const localConfigFile = path.resolve(process.cwd(), 'src', 'data-pipeline', 'pipeline.config.local.ts');

async function fetchFromFirestore<T extends object>(
    collectionName: string,
    whereClauses: [string, WhereFilterOp, string | number | boolean | Date][] = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>[]> {    logger.info({ collection: collectionName }, `[Config] Fetching dynamic sources from Firestore...`);
    const { adminDb } = await getFirebaseAdmin();
    
    let query: Query = adminDb.collection(collectionName);
    whereClauses.forEach(([field, op, value]) => {
        query = query.where(field, op, value);
    });

    const snapshot = await query.get();

    if (snapshot.empty) {
        logger.warn({ collection: collectionName }, `[Config] No matching documents found in collection.`);
        return [];
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFromLocalFile(configType: 'jobs' | 'briefings'): Promise<Record<string, any>[]> {
    logger.info({ file: localConfigFile }, `[Config] Loading sources from local configuration file...`);
    try {
        const localConfig = await import(localConfigFile);
        if (configType === 'jobs') {
            return localConfig.localJobSources || [];
        }
        if (configType === 'briefings') {
            return localConfig.localBriefingSources || [];
        }
        return [];
    } catch (error) {
        logger.fatal({ err: error, file: localConfigFile }, `[Config] CRITICAL: Failed to load local configuration file. Make sure it exists and is valid.`);
        // Exit because this is a critical misconfiguration.
        process.exit(1);
    }
}

/**
 * A generic function to fetch, validate, and filter documents from either Firestore or a local file.
 *
 * @param configType The type of configuration to load ('jobs' or 'briefings').
 * @param collectionName The name of the Firestore collection to query.
 * @param schema The Zod schema to validate each document against.
 * @param whereClauses An array of where clauses for the Firestore query (only used for Firestore).
 * @returns A promise that resolves to an array of validated documents.
 */
export async function loadAndValidateSourceConfigs<T extends object>(
    configType: 'jobs' | 'briefings',
    collectionName: string,
    schema: z.ZodSchema<T>,
    whereClauses: [string, WhereFilterOp, string | number | boolean | Date][] = []
): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawConfigs: Record<string, any>[];

    if (useLocalConfig) {
        rawConfigs = await fetchFromLocalFile(configType);
    } else {
        rawConfigs = await fetchFromFirestore(collectionName, whereClauses);
    }

    const configs: T[] = [];
    for (const rawConfig of rawConfigs) {
        // Firestore returns Timestamps, Zod often expects Dates. We need to convert before validation.
        const dataToValidate = { ...rawConfig };
        for (const key in dataToValidate) {
            if (dataToValidate[key] instanceof Timestamp) {
                dataToValidate[key] = dataToValidate[key].toDate();
            }
        }

        const validationResult = schema.safeParse(dataToValidate);

        if (!validationResult.success) {
            logger.error({ err: validationResult.error, configId: rawConfig.id || rawConfig.name, collection: collectionName }, `[Config] Invalid source configuration. Skipping.`);
            continue;
        }
        
        // For local configs, we might want to manually filter what would have been handled by `where` clauses
        if (useLocalConfig) {
            let include = true;
            for (const [field, op, value] of whereClauses) {
                // This is a simplified filter. It only handles '==' for now.
                if (op === '==' && validationResult.data[field as keyof T] !== value) {
                    include = false;
                    break;
                }
            }
            if (!include) continue;
        }

        configs.push(validationResult.data);
    }

    logger.info({ count: configs.length, source: useLocalConfig ? 'local file' : 'Firestore' }, `[Config] Successfully loaded and validated source configurations.`);
    return configs;
}