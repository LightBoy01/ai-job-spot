import { z } from 'zod';

// Defines the schema for a JobItem, ensuring data integrity before it's written to a file.
export const JobItemSchema = z.object({
  id: z.string().min(1, { message: 'ID must not be empty' }),
  title: z.string().min(1, { message: 'Title must not be empty' }),
  company: z.string().min(1, { message: 'Company must not be empty' }),
  location: z.string().optional(),
  description: z.string(), // Can be empty, but must be a string
  applicationLink: z.string().url({ message: 'Application link must be a valid URL' }),
  postedDate: z.string().datetime({ message: 'Posted date must be a valid ISO date string' }).optional(),
  tags: z.array(z.string()),
  status: z.literal('pending_review'),
  jobLevel: z.string().optional(),
  employeeRole: z.string().optional(),
  salaryRange: z.string().optional(),
  source: z.string().optional(),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
});

// We can infer the TypeScript type directly from the schema
export type ValidatedJobItem = z.infer<typeof JobItemSchema>;
