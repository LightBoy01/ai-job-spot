import { getJobIdFromRawItem } from '../utils/id-generation.js';
import { ApiResponseSchema } from '../schemas/arbeitnow.js';
import path from 'path';
import fs from 'fs/promises';
import { gotScraping } from 'got-scraping';
import logger from '../utils/logger.js';
import { ArbeitnowConfig } from '../sources/arbeitnow.js';


const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');

/**
 * Fetches jobs from the Arbeitnow API.
 */
export async function fetchJobs(config?: ArbeitnowConfig): Promise<unknown[]> {
    logger.info('[Arbeitnow] Fetching jobs incrementally...');

    // 1. Get existing job IDs from the filesystem.
    const existingJobIds = new Set<string>();
    try {
        const files = await fs.readdir(JOB_DESCRIPTIONS_DIR);
        for (const file of files) {
            if (file.endsWith('.md')) {
                existingJobIds.add(path.basename(file, '.md'));
            }
        }
    } catch (error) {
        logger.error({ err: error }, '[Arbeitnow] Could not read job descriptions directory. Falling back to full fetch.');
        // If we can't read the directory, we can't do an incremental fetch.
        // The Set will be empty, and it will proceed as a full fetch.
    }
    logger.info({ jobCount: existingJobIds.size }, `[Arbeitnow] Found existing jobs on disk.`);

    const newJobs: unknown[] = [];
    const maxPages = typeof config?.maxPages === 'number' && config.maxPages > 0 ? config.maxPages : 1; // Default to 1 page if not specified or invalid
    let stopFetching = false;

    for (let page = 0; page < maxPages; page++) {
        if (stopFetching) {
            logger.info('[Arbeitnow] Reached already processed jobs. Stopping fetch.');
            break;
        }

        if (!config?.baseUrl) {
            logger.error('[Arbeitnow] baseUrl is not defined in the config.');
            return [];
        }
        let API_URL = config.baseUrl; // Declare here, initialize with base URL

        try {
            const params = new URLSearchParams();
            if (config?.keywords && config.keywords.length > 0) {
                params.append('query', config.keywords.join(' ')); // Assuming 'query' parameter for keywords
            }
            if (config?.remote !== undefined) {
                params.append('remote', String(config.remote));
            }
            if (config?.visa_sponsorship !== undefined) {
                params.append('visa_sponsorship', String(config.visa_sponsorship));
            }
            params.append('page', String(page + 1)); // API is 1-indexed

            if (params.toString()) { // Only append if there are parameters
                API_URL = `${API_URL}?${params.toString()}`;
            }
            logger.info({ url: API_URL }, '[Arbeitnow] Fetching jobs with filters...');

            const response = await gotScraping.get(API_URL).json<unknown>();
            const parsedData = ApiResponseSchema.parse(response);

            if (parsedData.data.length === 0) {
                logger.info('[Arbeitnow] No more jobs found from API. Stopping.');
                break;
            }

            for (const rawJob of parsedData.data) {
                const jobId = getJobIdFromRawItem(rawJob);
                if (existingJobIds.has(jobId)) {
                    // We've reached a job we already have. Stop after this page.
                    stopFetching = true;
                } else {
                    newJobs.push(rawJob);
                }
            }

        } catch (error) {
            logger.error({ err: error, url: API_URL }, '[Arbeitnow] An error occurred during fetch:');
            break;
        }
    }

    logger.info({ newJobCount: newJobs.length }, `[Arbeitnow] Fetched a total of new jobs.`);
    return newJobs;
}
