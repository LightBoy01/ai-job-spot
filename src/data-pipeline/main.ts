import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';
import matter from 'gray-matter';
import pThrottle from 'p-throttle';

import { IJobSource } from './types.js';
import { SOURCES_TO_RUN } from './pipeline.config.js';
import { writeJobFile } from './writer.js';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../lib/normalization.js';

// --- Configuration ---
const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'scripts', 'archive');
const FRESHNESS_THRESHOLD_HOURS = 30 * 24; // Only process jobs posted within the last 30 days

interface LocalJobData {
  filePath: string;
  id: string;
}

/**
 * Generates a consistent, source-agnostic ID for a job based on its core attributes.
 * This ID can be used for duplicate detection across different sources.
 */
function generateJobHashId(company: string, title: string, location:string): string {
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedTitle = normalizeJobTitle(title);
  const normalizedLocation = normalizeLocation(location);
  const combinedString = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

/**
 * Reads all local job files to get their IDs (hash-based).
 * This is used for efficient duplicate checking.
 * @returns A Map where the key is the hash-based job ID and the value is the LocalJobData.
 */
async function getAllLocalJobHashIds(): Promise<Map<string, LocalJobData>> {
  const localJobHashIds = new Map<string, LocalJobData>();
  try {
    const files = await fs.readdir(JOB_DESCRIPTIONS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(JOB_DESCRIPTIONS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);
        
        if (data.id) {
          localJobHashIds.set(data.id, { filePath, id: data.id });
        } else {
          console.warn(`[Orchestrator] Warning: Skipping ${file} due to missing ID in frontmatter.`);
        }
      } catch (readError) {
        console.warn(`[Orchestrator] Warning: Could not read frontmatter for ${file}. Skipping.`, readError);
      }
    }
  }
  catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[Orchestrator] Warning: Could not read job descriptions directory.`, error);
    }
  }
  return localJobHashIds;
}

/**
 * Reads all local job files for a specific source to get their status and path.
 * @returns A Map where the key is the job ID and the value is its frontmatter.
 */
async function getLocalJobs(sourceName: string): Promise<Map<string, unknown>> {
    const localJobs = new Map<string, unknown>();
    try {
        const files = await fs.readdir(JOB_DESCRIPTIONS_DIR);
        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const filePath = path.join(JOB_DESCRIPTIONS_DIR, file);
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const { data } = matter(fileContent);

                if (data.source === sourceName && data.id) {
                    localJobs.set(data.id, { ...data, filePath });
                }
            } catch (readError) {
                console.warn(`[Orchestrator] Warning: Could not read frontmatter for ${file}. Skipping.`, readError);
            }
        }
    }
    catch (error: unknown) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`[Orchestrator] Warning: Could not read job descriptions directory.`, error);
        }
    }
    return localJobs;
}


/**
 * Processes a single job source: fetches, diffs, archives, and writes new/updated jobs.
 * @param source The job source to process.
 */
async function processSource(source: IJobSource, allLocalJobHashIds: Map<string, LocalJobData>) {
  console.log(`
--- Syncing source: ${source.name} ---
`);
  const now = new Date();
  const freshnessCutoff = new Date(now.getTime() - FRESHNESS_THRESHOLD_HOURS * 60 * 60 * 1000);

  try {
    // 1. Fetch all jobs from the remote API
    console.log(`[Sync] Fetching jobs from ${source.name}...`);
    const remoteJobs = await source.fetchJobs();
    
    const remoteJobHashIds = new Set<string>();
    const remoteJobMap = new Map<string, unknown>(); // Map hash ID to raw job data

    let newJobsCount = 0;
    let oldJobsSkippedCount = 0;

    interface PartialRawJob {
        v5_processed_job_data?: {
            company_name?: string;
            formatted_workplace_location?: string;
            estimated_publish_date_millis?: number | string | null;
        };
        company_name?: string;
        job_information?: {
            title?: string;
        };
        title?: string;
        location?: string;
    }

    for (const rawJob of remoteJobs) {
        const typedRawJob = rawJob as PartialRawJob;
        const rawJobCompany = typedRawJob.v5_processed_job_data?.company_name || typedRawJob.company_name;
        const rawJobTitle = typedRawJob.job_information?.title || typedRawJob.title;
        const rawJobLocation = typedRawJob.v5_processed_job_data?.formatted_workplace_location || typedRawJob.location;
        const rawJobPostedDate = typedRawJob.v5_processed_job_data?.estimated_publish_date_millis;

        if (rawJobCompany && rawJobTitle && rawJobLocation && rawJobPostedDate) {
            const postedDate = new Date(parseInt(String(rawJobPostedDate), 10));
            if (isNaN(postedDate.getTime())) {
                console.warn(`[Sync] Skipping remote job from ${source.name} due to invalid postedDate: ${rawJobPostedDate}`);
                continue;
            }

            if (postedDate < freshnessCutoff) {
                oldJobsSkippedCount++;
                continue;
            }

            const hashId = generateJobHashId(rawJobCompany, rawJobTitle, rawJobLocation);
            remoteJobHashIds.add(hashId);
            remoteJobMap.set(hashId, rawJob);
            newJobsCount++;
        } else {
            console.warn(`[Sync] Skipping remote job from ${source.name} due to missing company, title, location, or postedDate for hash ID generation.`);
        }
    }
    console.log(`[Sync] Found ${remoteJobHashIds.size} unique hash IDs from source API. Processed ${newJobsCount} fresh jobs, skipped ${oldJobsSkippedCount} old jobs.`);

    // 2. Get all local jobs for this source (for ID-based overwrite and archival)
    const localJobsForSource = await getLocalJobs(source.name);
    console.log(`[Sync] Found ${localJobsForSource.size} local markdown files for ${source.name}.`);

    // 3. Archive stale local files that are no longer in the API response
    let archivedCount = 0;
    for (const [localId, localJobData] of localJobsForSource.entries()) {
        if (!remoteJobHashIds.has(localId)) {
            const oldPath = (localJobData as { filePath: string }).filePath;
            const newPath = path.join(ARCHIVE_DIR, path.basename(oldPath));
            await fs.rename(oldPath, newPath);
            console.log(`[Sync] Archived stale job: ${path.basename(oldPath)}`);
            archivedCount++;
        }
    }
    if (archivedCount > 0) {
        console.log(`[Sync] Successfully archived ${archivedCount} stale jobs.`);
    }

    // 4. Refresh/create jobs from the API data with hash-based duplicate check
    let successCount = 0;
    const skippedDuplicatesCount = 0;
    let errorCount = 0;

    for (const hashId of remoteJobHashIds) {
        const rawJob = remoteJobMap.get(hashId);
        if (!rawJob) continue;

        try {
            const oldJobData = localJobsForSource.get(hashId) as { status?: string } | undefined;
            const oldStatus = oldJobData?.status;

            if (allLocalJobHashIds.has(hashId)) {
                // Overwrite existing job to ensure freshness
                const standardJob = source.transform(rawJob, oldStatus);
                standardJob.source = source.name;
                await writeJobFile(standardJob, hashId);
                successCount++;
            } else {
                // Write as a new job
                const standardJob = source.transform(rawJob, oldStatus);
                standardJob.source = source.name;
                await writeJobFile(standardJob, hashId);
                successCount++;
            }
        } catch (transformError: unknown) {
            const errorMessage = transformError instanceof Error ? transformError.message : JSON.stringify(transformError);
            console.error(`[Refresh] Error processing job with hash ID ${hashId} from ${source.name}: ${errorMessage}`);
            errorCount++;
        }
    }
    console.log(`--- Source ${source.name} complete. Refreshed/created: ${successCount}, Skipped Duplicates: ${skippedDuplicatesCount}, Errors: ${errorCount} ---
`);

  } catch (error) {
    const fetchError = error instanceof Error ? error : new Error(JSON.stringify(error));
    console.error(`[Orchestrator] Failed to run sync for source: ${source.name}`, fetchError);
  }
}

/**
 * The main orchestrator for the data pipeline.
 */
async function main() {
  console.log('[Orchestrator] Starting Sync & Refresh pipeline...');
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  // Load all existing local job hash IDs for duplicate checking
  const allLocalJobHashIds = await getAllLocalJobHashIds();
  console.log(`[Orchestrator] Loaded ${allLocalJobHashIds.size} existing local job hash IDs.`);

  // Define a throttle to process 1 source every 7 seconds to be safe with APIs
  const throttle = pThrottle({ limit: 1, interval: 7000 });

  const throttledProcessSource = throttle(async (source: IJobSource) => {
    await processSource(source, allLocalJobHashIds);
  });

  await Promise.all(SOURCES_TO_RUN.map(source => throttledProcessSource(source)));

  console.log('\n[Orchestrator] Sync & Refresh pipeline finished.');
}

main().catch(error => {
  console.error('[Orchestrator] A critical error occurred during pipeline execution:', error);
  process.exit(1);
});
