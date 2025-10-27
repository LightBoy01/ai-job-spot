import { z } from 'zod';
import { IBriefingSource } from './types.js';
import { Source } from '@/lib/types.js';
import { loadAndValidateSourceConfigs } from './utils/getConfig.js';
import { sourceAdapterFactory } from './source-adapter-factory.js';
import { loadSourcesFromCache, saveSourcesToCache } from './utils/source-cache.js';
import logger from './utils/logger.js';

// This schema is now aligned with the `Source` type from `lib/types.ts`
const BriefingSourceConfigSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  feedUrl: z.string().url(),
  type: z.enum(['Job', 'Article']),
  adapter: z.enum(['RSS', 'RSS_HUB', 'HIRING_CAFE', 'HIRING_CAFE_API']),
  status: z.enum(['Pending', 'Active', 'Inactive']),
  keywords: z.array(z.string()).optional(),
  fetchFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  lastFetchedAt: z.date().nullable().optional(),
  notes: z.string().optional(),
  // The 'enabled' field is not part of the original Source type, but is used in the query.
  // We can make it optional here to satisfy the schema for validation.
  enabled: z.boolean().optional(),
});

/**
 * Fetches, validates, and constructs the briefing source configurations from Firestore.
 *
 * @returns A promise that resolves to an array of fully configured and validated briefing sources.
 */
export async function getBriefingSources(): Promise<IBriefingSource[]> {
  const forceRefresh = process.argv.includes('--force-refresh');

  if (!forceRefresh) {
    const cachedSources = await loadSourcesFromCache();
    if (cachedSources) {
      logger.info('[Config] Using cached briefing sources.');
      const sources = cachedSources
        .map(config => sourceAdapterFactory.createSource(config))
        .filter((source): source is IBriefingSource => source !== null && 'fetchItems' in source);
      return sources;
    }
  }

  logger.info('[Config] Fetching briefing sources from Firestore.');
  const briefingSourceConfigs = await loadAndValidateSourceConfigs(
    'briefings',
    'sources',
    BriefingSourceConfigSchema as z.ZodSchema<Source>, // Cast to satisfy the generic function
    [['type', '==', 'Article'], ['enabled', '==', true]]
  );

  await saveSourcesToCache(briefingSourceConfigs);

  const sources = briefingSourceConfigs
    .map(config => sourceAdapterFactory.createSource({
        name: config.sourceName,
        adapter: config.adapter,
        feedUrl: config.feedUrl,
        config: { ...config } // Pass the whole original config object
    }))
    .filter((source): source is IBriefingSource => source !== null && 'fetchItems' in source);

  return sources;
}