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
  // The function that fetches raw data
  fetchJobs: () => Promise<unknown[]>;
  // The function that transforms raw data into a standard format
  transform: (rawJob: unknown, oldStatus?: string) => StandardJob;
}