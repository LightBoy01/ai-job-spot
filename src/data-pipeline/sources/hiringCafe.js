import { gotScraping } from 'got-scraping';
import { z } from 'zod';
import TurndownService from 'turndown';
import { logger } from '../utils/logger.js';
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
const API_URL = 'https://hiring.cafe/api/search-jobs';
const turndownService = new TurndownService();
/**
 * Fetches jobs from the hiring.cafe JSON API.
 */
async function fetchJobs(config) {
    logger.info('[hiring.cafe] Fetching jobs...');
    const allJobs = [];
    // Use maxPages from the dynamic config, with a sensible default
    const maxPages = typeof config?.maxPages === 'number' ? config.maxPages : 1;
    for (let page = 0; page < maxPages; page++) {
        try {
            const response = await gotScraping.post({
                url: API_URL,
                json: {
                    size: 50,
                    page: page,
                    searchState: { searchQuery: 'AI', sortBy: 'date' },
                },
                retry: {
                    limit: 3, // Retry up to 3 times
                    methods: ['POST'], // Retry on POST requests
                    statusCodes: [408, 413, 429, 500, 502, 503, 504], // Retry on these status codes
                    errorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'] // Retry on these network errors
                }
            });
            let rawData;
            try {
                rawData = JSON.parse(response.body);
            }
            catch {
                logger.error(`[hiring.cafe] Failed to parse JSON response. Raw body:`, response.body);
                break; // Stop processing this source if we get invalid JSON
            }
            const parsedData = ApiResponseSchema.parse(rawData);
            if (parsedData.results.length === 0) {
                logger.info('[hiring.cafe] No more jobs found. Stopping.');
                break;
            }
            allJobs.push(...parsedData.results);
        }
        catch (error) {
            logger.error('[hiring.cafe] An error occurred during fetch:', error);
            break;
        }

        // Add a delay to avoid rate-limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    logger.info(`[hiring.cafe] Fetched a total of ${allJobs.length} jobs.`);
    return allJobs;
}
/**
 * Transforms a raw job object from the hiring.cafe API into our StandardJob format.
 */
function transform(rawJob, oldStatus) {
    const jobData = JobResultSchema.parse(rawJob);
    const { job_information: jobInfo, v5_processed_job_data: processedData, apply_url, id } = jobData;
    const descriptionAsMarkdown = turndownService.turndown(jobInfo.description || '');
    // Sanity Check: Ensure the new description is not empty or trivial.
    if (!descriptionAsMarkdown || descriptionAsMarkdown.length < 50) {
        throw new Error(`Skipping job ${id} due to invalid or empty description from API.`);
    }
    let salaryRange = null;
    if (processedData.is_compensation_transparent && processedData.yearly_min_compensation && processedData.yearly_max_compensation) {
        salaryRange = `$${processedData.yearly_min_compensation.toLocaleString()} - $${processedData.yearly_max_compensation.toLocaleString()}`;
    }
    // Status Inheritance Logic
    const validStatuses = ['pending_review', 'published', 'expired'];
    const newStatus = (oldStatus && validStatuses.includes(oldStatus)) ? oldStatus : 'pending_review';
    const job = {
        id: id, // Use the original ID from the source, hash ID will be used for filename and frontmatter
        title: jobInfo.title,
        company: processedData.company_name || 'Unknown Company',
        location: processedData.formatted_workplace_location || 'Remote',
        applicationLink: apply_url,
        postedDate: processedData.estimated_publish_date_millis ? new Date(parseInt(String(processedData.estimated_publish_date_millis), 10)).toISOString() : new Date().toISOString(),
        expirationDate: null, // Not provided by this source
        tags: [processedData.job_category, ...processedData.role_activities].filter(Boolean),
        status: newStatus,
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
export const hiringCafeSource = {
    name: 'hiring.cafe',
    fetchJobs,
    transform,
};
