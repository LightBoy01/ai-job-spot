import { z } from 'zod';

/**
 * Defines the base schema for any item processed by the aggregation pipeline.
 * It includes fields that are common to both Articles and Jobs.
 */
export const BaseItemSchema = z.object({
  title: z.string().min(1, { message: "Title must not be empty." }),
  link: z.string().url({ message: "Link must be a valid URL." }),
  guid: z.string().optional(), // guid is often used for unique identification
});

/**
 * Defines the schema for an Article, extending the BaseItemSchema.
 * It adds fields specific to articles.
 */
export const ArticleSchema = BaseItemSchema.extend({
  pubDate: z.string().optional(), // Publication date
  creator: z.string().optional(), // Author
  content: z.string().optional(), // Full content
  contentSnippet: z.string().optional(), // Short snippet
});

/**
 * Defines the schema for a Job, extending the BaseItemSchema.
 * It adds fields specific to job postings.
 */
export const JobSchema = BaseItemSchema.extend({
  company: z.string().optional(),
  location: z.string().optional(),
  pubDate: z.string().optional(), // Publication date
  description: z.string().optional(),
});

// We can also define a type for the items for easier use in our code.
export type Article = z.infer<typeof ArticleSchema>;
export type Job = z.infer<typeof JobSchema>;
