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
    status: z.enum(['pending_review', 'content_incomplete', 'published']),
    tags: z.array(z.string()),
    excerpt: z.string(),
    content: z.string(),
});
