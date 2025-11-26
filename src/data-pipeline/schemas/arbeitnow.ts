import { z } from 'zod';

// --- Zod Schemas for API validation ---
export const ArbeitnowJobSchema = z.object({
    slug: z.string(),
    company_name: z.string(),
    title: z.string(),
    description: z.string(),
    remote: z.boolean(),
    url: z.string().url(),
    tags: z.array(z.string()),
    job_types: z.array(z.string()),
    location: z.string(),
    created_at: z.number(), // Unix timestamp
});

export const ApiResponseSchema = z.object({
    data: z.array(ArbeitnowJobSchema),
});
