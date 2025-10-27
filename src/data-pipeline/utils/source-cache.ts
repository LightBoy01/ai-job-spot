
import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger.js';
import { IJobSource, IBriefingSource } from '../types.js';

const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'data-pipeline');
const CACHE_FILE_PATH = path.join(CACHE_DIR, 'sources.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// A source can be for jobs or briefings
type SourceConfig = IJobSource | IBriefingSource;

export interface CachedSourceData {
  timestamp: number;
  sources: SourceConfig[];
}

/**
 * Saves the provided source configurations to the local cache.
 * @param sources The source configurations to cache.
 */
export async function saveSourcesToCache(sources: SourceConfig[]): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const dataToCache: CachedSourceData = {
      timestamp: Date.now(),
      sources,
    };
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(dataToCache, null, 2), 'utf-8');
    logger.info('[Cache] Successfully saved source configurations to local cache.');
  } catch (error) {
    logger.warn({ err: error }, '[Cache] Failed to save source configurations to cache.');
  }
}

/**
 * Loads the source configurations from the local cache if available and not stale.
 * @returns The cached source configurations or null if the cache is invalid.
 */
export async function loadSourcesFromCache(): Promise<SourceConfig[] | null> {
  try {
    const cachedDataString = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
    const cachedData: CachedSourceData = JSON.parse(cachedDataString);

    const isCacheStale = (Date.now() - cachedData.timestamp) > CACHE_TTL;
    if (isCacheStale) {
      logger.info('[Cache] Local source cache is stale. Fetching from Firestore.');
      return null;
    }

    logger.info('[Cache] Successfully loaded source configurations from local cache.');
    return cachedData.sources;
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.code === 'ENOENT') {
      logger.info('[Cache] No local source cache found. Fetching from Firestore.');
    } else {
      logger.warn({ err: error }, '[Cache] Failed to load source configurations from cache.');
    }
    return null;
  }
}
