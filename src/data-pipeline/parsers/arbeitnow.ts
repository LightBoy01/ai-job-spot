import { StandardJob, StandardJobSchema } from '../types.js';
import TurndownService from 'turndown';
import logger from '../utils/logger.js';
import { ArbeitnowJobSchema } from '../schemas/arbeitnow.js';

const turndownService = new TurndownService();

/**
 * Transforms a raw job object from the Arbeitnow API into our StandardJob format.
 */
export function transform(rawJob: unknown): StandardJob | null {
    try {
        const jobData = ArbeitnowJobSchema.parse(rawJob);

        const descriptionAsMarkdown = turndownService.turndown(jobData.description || '');

        const job: Partial<StandardJob> = {
            id: jobData.slug,
            title: jobData.title,
            company: jobData.company_name,
            location: jobData.location,
            applicationLink: jobData.url,
            postedDate: new Date(jobData.created_at * 1000).toISOString(),
            expirationDate: null, // Not provided
            tags: jobData.tags,
            status: 'pending_review',
            jobLevel: null, // Not provided
            employeeRole: null, // Not provided
            salaryRange: null, // Not provided
            source: 'arbeitnow',
            sourceUrl: jobData.url,
            companyLogoUrl: null, // Not provided by Arbeitnow API
            description: descriptionAsMarkdown,
            responsibilities: [], // Not separated
            qualifications: [], // Not separated
        };

        return StandardJobSchema.parse(job);
    } catch (error) {
        logger.warn({ err: error, rawJob }, '[Arbeitnow] Transformed job failed validation.');
        return null;
    }
}
