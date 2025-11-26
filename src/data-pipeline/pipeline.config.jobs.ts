import { z } from 'zod';
import { IJobSource } from './types.js';
import { Source } from '@/lib/types.js';
import { loadAndValidateSourceConfigs } from './utils/getConfig.js';
import { sourceAdapterFactory } from './source-adapter-factory.js';
import { loadSourcesFromCache, saveSourcesToCache } from './utils/source-cache.js';
import logger from './utils/logger.js';

// This schema is now aligned with the `Source` type from `lib/types.ts`
const JobSourceConfigSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  feedUrl: z.string().url().nullable().optional(), // Optional for non-RSS sources
  type: z.enum(['Job', 'Article']),
  adapter: z.enum(['RSS', 'Playwright', 'HiringCafe', 'HIRING_CAFE', 'HIRING_CAFE_API', 'Arbeitnow']),
  status: z.enum(['Pending', 'Active', 'Inactive']),
  keywords: z.array(z.string()).optional(),
  fetchFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  lastFetchedAt: z.date().nullable().optional(),
  notes: z.string().optional(),
  // The 'enabled' field is used in the query but is part of the Source type.
  enabled: z.boolean().optional(),
  baseUrl: z.string().url().optional(),
  remote: z.boolean().optional(),
  visa_sponsorship: z.boolean().optional(),
  maxPages: z.number().optional(), // Add maxPages to the schema
});


/**
 * Fetches, validates, and constructs the job source configurations from Firestore.
 *
 * @returns A promise that resolves to an array of fully configured and validated job sources.
 */
export async function getJobSources(): Promise<IJobSource[]> {
  const forceRefresh = process.argv.includes('--force-refresh');

  if (!forceRefresh) {
    const cachedSources = await loadSourcesFromCache();
    if (cachedSources) {
      logger.info('[Config] Using cached job sources.');
      const sources = cachedSources
        .filter(config => config.type === 'Job') // Filter for job sources first
        .map(config => sourceAdapterFactory.createSource({
            name: config.sourceName,
            adapter: config.adapter,
            feedUrl: config.feedUrl,
            config: { ...config } // Pass the whole original config object
        }))
        .filter((source): source is IJobSource => source !== null && 'fetchJobs' in source);
      return sources;
    }
  }

  logger.info('[Config] Fetching job sources from Firestore.');
  const jobSourceConfigs = await loadAndValidateSourceConfigs(
    'jobs', // Firestore collection group
    'sources', // Target collection ID
    JobSourceConfigSchema as z.ZodSchema<Source>, // Cast to satisfy the generic function
    [['type', '==', 'Job'], ['enabled', '==', true]]
  );

  await saveSourcesToCache(jobSourceConfigs);

  const sources = jobSourceConfigs
    .map(config => sourceAdapterFactory.createSource({
        name: config.sourceName,
        adapter: config.adapter,
        feedUrl: config.feedUrl,
        config: { ...config } // Pass the whole original config object
    }))
    .filter((source): source is IJobSource => source !== null && 'fetchJobs' in source);

  // Manually add the local hiring.cafe source
  // sources.push(hiringCafeSource);
  // logger.info('[Config] Manually added local hiring.cafe source.');



  return sources;
}
