import crypto from 'crypto';
import { z } from 'zod';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../../lib/normalization.js';
import logger from './logger.js';

export function generateJobHashId(company: string, title: string, location:string): string {
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedTitle = normalizeJobTitle(title);
  const normalizedLocation = normalizeLocation(location);
  const combinedString = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

// Schema to validate the different possible shapes of a raw job object for ID generation
const RawJobForIdSchema = z.object({
    v5_processed_job_data: z.object({
        company_name: z.string().optional().nullable(),
        formatted_workplace_location: z.string().optional().nullable(),
    }).optional(),
    job_information: z.object({
        title: z.string().optional().nullable(),
    }).optional(),
    company_name: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
});

export function getJobIdFromRawItem(rawJob: unknown): string {
    const validationResult = RawJobForIdSchema.safeParse(rawJob);

    if (!validationResult.success) {
        logger.warn({ err: validationResult.error, rawJob }, "[id-generation] Zod validation failed for raw job object.");
        return '';
    }

    const data = validationResult.data;

    const rawJobCompany = data.v5_processed_job_data?.company_name || data.company_name;
    const rawJobTitle = data.job_information?.title || data.title;
    const rawJobLocation = data.v5_processed_job_data?.formatted_workplace_location || data.location;

    if (rawJobCompany && rawJobTitle && rawJobLocation) {
        return generateJobHashId(rawJobCompany, rawJobTitle, rawJobLocation);
    }
    
    logger.warn({ jobData: data }, "[id-generation] Could not determine company, title, or location from raw job object.");
    return '';
}

export function generateBriefingId(originalUrl: string): string {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('hex');
  return `briefing-${hash}`;
}