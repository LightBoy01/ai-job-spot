import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { hiringCafeSource } from './sources/hiringCafe.ts';
import { writeJobFile } from './writer.ts';
import { IJobSource } from './types.ts';

// --- Configuration ---
const SOURCES_TO_RUN: IJobSource[] = [
  hiringCafeSource,
];

const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'scripts', 'archive');

/**
 * Reads all local job files for a specific source to get their status and path.
 * @returns A Map where the key is the job ID and the value is its frontmatter.
 */
async function getLocalJobs(sourceName: string): Promise<Map<string, unknown>> {
  const localJobs = new Map<string, unknown>();
  try {
    const files = await fs.readdir(JOB_DESCRIPTIONS_DIR);
    for (const file of files) {
      const id = path.basename(file, '.md');
      if (id.startsWith(`${sourceName}-`)) {
        const filePath = path.join(JOB_DESCRIPTIONS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);
        localJobs.set(id, { ...data, filePath });
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[Orchestrator] Warning: Could not read job descriptions directory.`);
    }
  }
  return localJobs;
}

/**
 * The main orchestrator for the data pipeline.
 */
async function main() {
  console.log('[Orchestrator] Starting Sync & Refresh pipeline...');
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  for (const source of SOURCES_TO_RUN) {
    console.log(`
--- Syncing source: ${source.name} ---`);
    try {
      // 1. Fetch all jobs from the remote API
      const remoteJobs = await source.fetchJobs();
      const remoteJobIds = new Set(remoteJobs.map((job: unknown) => `${source.name}-${(job as { id: string }).id}`));
      console.log(`[Sync] Found ${remoteJobIds.size} jobs at source API.`);

      // 2. Get all local jobs for this source
      const localJobs = await getLocalJobs(source.name);
      console.log(`[Sync] Found ${localJobs.size} local markdown files for ${source.name}.`);

      // 3. Archive stale local files that are no longer in the API response
      let archivedCount = 0;
      for (const [localId, localJobData] of localJobs.entries()) {
        if (!remoteJobIds.has(localId)) {
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

      // 4. Refresh/create jobs from the API data
      let successCount = 0;
      let errorCount = 0;
      for (const rawJob of remoteJobs) {
        try {
          const job_id = `${source.name}-${(rawJob as {id: string}).id}`;
          const oldJobData = localJobs.get(job_id) as { status?: string } | undefined;
          const oldStatus = oldJobData?.status;

          const standardJob = source.transform(rawJob, oldStatus);
          await writeJobFile(standardJob);
          successCount++;
        } catch (transformError: unknown) {
          const errorMessage = transformError instanceof Error ? transformError.message : JSON.stringify(transformError);
          console.error(`[Refresh] Error processing job ${(rawJob as {id: string}).id} from ${source.name}: ${errorMessage}`);
          errorCount++;
        }
      }
      console.log(`--- Source ${source.name} complete. Refreshed/created: ${successCount}, Errors: ${errorCount} ---`);

    } catch (error) {
      const fetchError = error instanceof Error ? error : new Error(JSON.stringify(error));
      console.error(`[Orchestrator] Failed to run sync for source: ${source.name}`, fetchError);
    }
  }

  console.log('\n[Orchestrator] Sync & Refresh pipeline finished.');
}

main().catch(error => {
  console.error('[Orchestrator] A critical error occurred during pipeline execution:', error);
  process.exit(1);
});