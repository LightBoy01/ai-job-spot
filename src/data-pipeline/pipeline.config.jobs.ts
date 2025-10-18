import { z } from 'zod';
import { IJobSource } from './types.js';
import { loadAndValidateSourceConfigs } from './utils/getConfig.js';
import { sourceAdapterFactory } from './source-adapter-factory.js';

// --- Individual Schema Definitions for each adapter type ---

const HiringCafeConfigSchema = z.object({
  // HiringCafe might have specific config options in the future
}).optional();

const RssConfigSchema = z.object({
  feedUrl: z.string().url(),
}).optional();

const PlaywrightConfigSchema = z.object({
  url: z.string().url(),
  selectors: z.object({
    jobLinkSelector: z.string(),
    titleSelector: z.string(),
    companySelector: z.string(),
    locationSelector: z.string(),
    descriptionSelector: z.string(),
    paginationSelector: z.string().optional(),
  }),
}).optional();


// --- Discriminated Union ---

const JobSourceConfigSchema = z.discriminatedUnion("adapter", [
  z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    adapter: z.literal("HiringCafe"),
    config: HiringCafeConfigSchema,
  }),
  z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    adapter: z.literal("RSS"),
    config: RssConfigSchema,
    // feedUrl is a legacy property we should still support for now
    feedUrl: z.string().url().optional(),
  }),
  z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    adapter: z.literal("Playwright"),
    config: PlaywrightConfigSchema,
  }),
]);


/**
 * Fetches, validates, and constructs the job source configurations from Firestore.
 *
 * @returns A promise that resolves to an array of fully configured and validated job sources.
 */
export async function getJobSources(): Promise<IJobSource[]> {
  const jobSourceConfigs = await loadAndValidateSourceConfigs(
    'jobs',
    'job-sources',
    JobSourceConfigSchema,
    [['enabled', '==', true]]
  );

  const sources = jobSourceConfigs
    .map(config => sourceAdapterFactory.createSource(config))
    .filter((source): source is IJobSource => source !== null && 'fetchJobs' in source);

  return sources;
}
