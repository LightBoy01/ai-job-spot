import { z } from 'zod';

// Zod schema for the final, standardized job object.
// This will be used to validate data before it's written to a file.
export const StandardJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  applicationLink: z.string().url(),
  postedDate: z.string(), // ISO 8601 format
  expirationDate: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.enum(['pending_review', 'published', 'expired']),
  jobLevel: z.string().nullable(),
  employeeRole: z.string().nullable(),
  salaryRange: z.string().nullable(),
  source: z.string(), // e.g., 'hiring.cafe', 'yc'
  sourceUrl: z.string().url().nullable(),
  companyLogoUrl: z.string().url().nullable(),
  hasSalary: z.boolean().optional(),
  description: z.string(), // The main body content in Markdown format
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
});

export type StandardJob = z.infer<typeof StandardJobSchema>;

// Interface for a job source module
export interface IJobSource {
  // The unique name of the source
  name: string;
  // Optional config object for source-specific settings
  config?: Record<string, unknown>;
  // The function that fetches raw data, accepting the config
  fetchJobs: (config?: Record<string, unknown>) => Promise<unknown[]>;
  // The function that transforms raw data into a standard format
  transform: (rawJob: unknown, oldStatus?: string) => StandardJob | null;
}

/**
 * Defines the configuration required for a Playwright-based scraper.
 */
export interface PlaywrightSourceConfig {
    sourceName: string;
    url: string;
    selectors: {
        jobLinkSelector: string;
        titleSelector: string;
        companySelector: string;
        locationSelector: string;
        descriptionSelector: string;
        paginationSelector?: string; // Optional
    };
}


// --- Briefings ---

// Zod schema for the final, standardized briefing object.
export const StandardBriefingSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    author: z.string(),
    publishDate: z.date(),
    contentType: z.literal('briefing'),
    sourceName: z.string(),
    originalUrl: z.string().url(),
    status: z.enum(['pending_review', 'content_incomplete', 'published', 'pending_approval']),
    tags: z.array(z.string()),
    excerpt: z.string(),
    content: z.string(),
});

export type StandardBriefing = z.infer<typeof StandardBriefingSchema>;

// Interface for a briefing source module
export interface IBriefingSource {
    // The unique name of the source
    name: string;
    // Optional config object for source-specific settings
    config?: Record<string, unknown>;
    // The function that fetches raw items
    fetchItems: () => Promise<unknown[]>;
    // The function that transforms a raw item into a standard format
    transform: (rawItem: unknown) => StandardBriefing | null;
}