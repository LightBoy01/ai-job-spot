import { z } from 'zod';

// Helper for optional string that can be null or empty
const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((e) => (e === '' ? null : e));

// Helper for optional URL string that can be null or empty
const optionalUrl = z
  .string()
  .url('Must be a valid URL')
  .nullable()
  .optional()
  .transform((e) => (e === '' ? null : e));

export const ArticleSchema = z.object({
  slug: z
    .string()
    .min(1, 'URL Slug is required.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'URL Slug must be lowercase, alphanumeric, and use hyphens for spaces (e.g., my-awesome-article).'
    ),
  title: z.string().min(1, 'Article Title is required.'),
  author: z.string().min(1, 'Author is required.'),
  publishDate: z.string().min(1, 'Publish Date is required.'),
  contentBody: z
    .string()
    .min(1, 'Article Content is required.')
    .refine((data) => data !== '<p><br></p>', 'Article Content is required.'),
  tags: z.array(z.string()).optional(),
  issueNo: z
    .number()
    .int()
    .positive('Issue Number must be a positive number.')
    .optional(),
  volumeNo: z
    .number()
    .int()
    .positive('Volume Number must be a positive number.')
    .optional(),
  imageUrl: optionalUrl,
  excerpt: z.string().optional(),
  author_take_question1: z.string().nullable().optional(),
  author_take_answer1: z.string().nullable().optional(),
  author_take_question2: z.string().nullable().optional(),
  author_take_answer2: z.string().nullable().optional(),
});

export type ArticleFormData = z.infer<typeof ArticleSchema>;

export const JobPostingSchema = z
  .object({
    id: z.string().optional(), // ID is optional for new jobs
    title: z.string().min(1, 'Job Title is required.'),
    company: z.string().min(1, 'Company is required.'),
    companyLogoUrl: optionalUrl.optional(),
    description: z
      .string()
      .min(1, 'Job Description is required.')
      .refine((data) => data !== '<p><br></p>', 'Job Description is required.'),
    responsibilities: z.string().optional(), // Keep as string for form input
    qualifications: z.string().optional(), // Keep as string for form input
    preferredQualifications: z.string().optional(), // Keep as string for form input
    location: z.string().min(1, 'Location is required.'),
    salaryRange: optionalString,
    postedDate: z.string().min(1, 'Posted Date is required.'), // Keep as string for form input
    expirationDate: z.string().nullable().optional(), // Keep as string for form input
    applicationLink: z.string().url('Application Link must be a valid URL.'),
    applicationExperience: optionalString,
    tags: z.string().optional(), // Keep as string for form input
    jobLevel: optionalString,
    employeeRole: optionalString,
    status: z
      .enum(['draft', 'pending_review', 'published', 'rejected'])
      .default('draft'),
    isNew: z.boolean().default(true),
    source: optionalString,
    sourceUrl: optionalUrl,
    verificationDate: z.string().nullable().optional(), // Keep as string for form input
    glassdoorLink: optionalUrl,
    crunchbaseLink: optionalUrl,
    story_question1: z.string().min(1, 'Human Context Question is required when providing an answer.').optional().nullable(),
    story_answer1: z.string()
      .min(200, 'Human Context Q&A must be at least 200 characters.')
      .refine((val) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = val.match(urlRegex);
        return !matches || matches.length <= 1;
      }, 'Human Context Q&A can contain at most one hyperlink.').optional().nullable(),
    story_question2: optionalString,
    story_answer2: optionalString,
    story_question3: optionalString,
    story_answer3: optionalString,
    companyCulture: optionalString,
  })
  .refine(
    (data) => {
      // Custom validation for dates
      if (data.postedDate && data.expirationDate) {
        const posted = new Date(data.postedDate);
        const expiration = new Date(data.expirationDate);
        return expiration > posted;
      }
      return true;
    },
    {
      message: 'Expiration Date must be after Posted Date.',
      path: ['expirationDate'],
    }
  );

export type JobFormData = {
  id?: string;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  description: string;
  responsibilities?: string;
  qualifications?: string;
  preferredQualifications?: string;
  location: string;
  salaryRange?: string | null;
  postedDate: string;
  expirationDate?: string | null;
  applicationLink: string;
  applicationExperience?: string | null;
  tags?: string;
  jobLevel?: string | null;
  employeeRole?: string | null;
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';
  isNew?: boolean;
  source?: string | null;
  sourceUrl?: string | null;
  verificationDate?: string | null;
  glassdoorLink?: string | null;
  crunchbaseLink?: string | null;
  story_question1?: string | null;
  story_answer1?: string | null;
  story_question2?: string | null;
  story_answer2?: string | null;
  story_question3?: string | null;
  story_answer3?: string | null;
  companyCulture?: string | null;
};
