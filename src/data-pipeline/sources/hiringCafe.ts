
import { gotScraping } from 'got-scraping';
import { z } from 'zod';
import TurndownService from 'turndown';
import { IJobSource, StandardJob } from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';


// Zod schemas based on the user-provided snippet for type safety
const GeoLocationSchema = z.object({
    lat: z.number(),
    lon: z.number(),
});

const JobInformationSchema = z.object({
    title: z.string(),
    description: z.string(),
});

const ProcessedJobDataSchema = z.object({
    company_name: z.string().nullable(),
    is_compensation_transparent: z.boolean(),
    yearly_min_compensation: z.number().nullable().optional(),
    yearly_max_compensation: z.number().nullable().optional(),
    workplace_type: z.string().optional(),
    requirements_summary: z.string().optional(),
    job_category: z.string(),
    role_activities: z.array(z.string()),
    formatted_workplace_location: z.string().optional(),
    estimated_publish_date_millis: z.union([z.string(), z.number()]).nullable().optional(),
});

const JobResultSchema = z.object({
    id: z.string(),
    apply_url: z.string().url(),
    job_information: JobInformationSchema,
    v5_processed_job_data: ProcessedJobDataSchema,
    _geoloc: z.array(GeoLocationSchema).optional(),
});

const ApiResponseSchema = z.object({
    results: z.array(JobResultSchema),
    total: z.number().optional(), // Total can sometimes be missing
});

type JobResult = z.infer<typeof JobResultSchema>;

// --- ID Generation Logic (mirrored from main.ts) ---

import { getJobIdFromRawItem } from '../utils/id-generation.js';

// --- API and File System Configuration ---

const API_URL = 'https://hiring.cafe/api/search-jobs';
const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const turndownService = new TurndownService();


/**
 * Fetches jobs from the hiring.cafe JSON API incrementally.
 * It stops fetching when it encounters a job that already exists on the filesystem.
 */
async function fetchJobs(config?: Record<string, unknown>): Promise<JobResult[]> {
    logger.info('[hiring.cafe] Fetching jobs incrementally...');
    
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
        logger.error({ err: error }, '[hiring.cafe] Could not read job descriptions directory. Falling back to full fetch.');
        // If we can't read the directory, we can't do an incremental fetch.
        // The Set will be empty, and it will proceed as a full fetch.
    }
    logger.info({ jobCount: existingJobIds.size }, `[hiring.cafe] Found existing jobs on disk.`);

    const newJobs: JobResult[] = [];
    const maxPages = typeof config?.maxPages === 'number' ? config.maxPages : 1;
    let stopFetching = false;

    for (let page = 0; page < maxPages; page++) {
        if (stopFetching) {
            logger.info('[hiring.cafe] Reached already processed jobs. Stopping fetch.');
            break;
        }

        try {
            const response = await gotScraping.post({
                url: API_URL,
                json: { size: 50, page: page, searchState: { searchQuery: 'AI', sortBy: 'date' } },
                retry: { limit: 3, methods: ['POST'], statusCodes: [408, 413, 429, 500, 502, 503, 504], errorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'] },
                timeout: { request: 120000 }
            });

            let rawData;
            try {
                rawData = JSON.parse(response.body);
            } catch (err) {
                logger.error({ err, body: response.body }, `[hiring.cafe] Failed to parse JSON response.`);
                break;
            }

            const parsedData = ApiResponseSchema.parse(rawData);

            if (parsedData.results.length === 0) {
                logger.info('[hiring.cafe] No more jobs found from API. Stopping.');
                break;
            }

            for (const rawJob of parsedData.results) {
                const jobId = getJobIdFromRawItem(rawJob);
                if (existingJobIds.has(jobId)) {
                    // We've reached a job we already have. Stop after this page.
                    stopFetching = true;
                } else {
                    newJobs.push(rawJob);
                }
            }

        } catch (error) {
            logger.error({ err: error }, '[hiring.cafe] An error occurred during fetch:');
            break;
        }
    }

    logger.info({ newJobCount: newJobs.length }, `[hiring.cafe] Fetched a total of new jobs.`);
    return newJobs;
}

/**
 * Transforms a raw job object from the hiring.cafe API into our StandardJob format.
 */
function transform(rawJob: unknown, oldStatus?: string): StandardJob | null {
    const jobData = JobResultSchema.parse(rawJob);
    const { job_information: jobInfo, v5_processed_job_data: processedData, apply_url, id } = jobData;

    // --- DATE FILTER ---
    if (!processedData.estimated_publish_date_millis) {
        return null; // Skip if no date is provided
    }
    const postedDate = new Date(parseInt(String(processedData.estimated_publish_date_millis), 10));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (postedDate < sevenDaysAgo) {
        return null; // Job is older than 7 days
    }

    // --- AI KEYWORD FILTER ---
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'natural language processing', 'computer vision', 'data scientist', 'generative ai', 'llm', 'large language model', 'agentic ai'];
    const title = jobInfo.title.toLowerCase();
    const description = jobInfo.description.toLowerCase();

    const hasAiKeyword = aiKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));

    if (!hasAiKeyword) {
        return null; // Not an AI job
    }

    const descriptionAsMarkdown = turndownService.turndown(jobInfo.description || '');

    // Sanity Check: Ensure the new description is not empty or trivial.
    if (!descriptionAsMarkdown || descriptionAsMarkdown.length < 50) {
        logger.warn({ jobId: id }, `Skipping job due to invalid or empty description from API.`);
        return null;
    }

    let salaryRange: string | null = null;
    if (processedData.is_compensation_transparent && processedData.yearly_min_compensation && processedData.yearly_max_compensation) {
        salaryRange = `$${processedData.yearly_min_compensation.toLocaleString()} - $${processedData.yearly_max_compensation.toLocaleString()}`;
    }

    // Status Inheritance Logic
    const validStatuses = ['pending_review', 'published', 'expired'];
    const newStatus = (oldStatus && validStatuses.includes(oldStatus)) ? oldStatus : 'pending_review';

    const job: StandardJob = {
        id: id, // Use the original ID from the source, hash ID will be used for filename and frontmatter
        title: jobInfo.title,
        company: processedData.company_name || 'Unknown Company',
        location: processedData.formatted_workplace_location || 'Remote',
        applicationLink: apply_url,
        postedDate: postedDate.toISOString(),
        expirationDate: null, // Not provided by this source
        tags: [processedData.job_category, ...processedData.role_activities].filter(Boolean),
        status: newStatus as 'pending_review' | 'published' | 'expired',
        jobLevel: null, // Can be inferred later if needed
        employeeRole: null, // Can be inferred later if needed
        salaryRange: salaryRange,
        hasSalary: processedData.is_compensation_transparent,
        source: 'hiring.cafe',
        sourceUrl: `https://hiring.cafe/jobs/${id}`,
        companyLogoUrl: null, // Not provided in this API response
        description: descriptionAsMarkdown,
        responsibilities: [], // Not explicitly separated in this API response
        qualifications: [], // Not explicitly separated in this API response
    };

    return job;
}

export const hiringCafeSource: IJobSource = {
    name: 'hiring.cafe',
    fetchJobs,
    transform,
};
