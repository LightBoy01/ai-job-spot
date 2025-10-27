const { z, ZodIssueCode } = require('zod');

// Helper for optional string that can be null or empty
const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((e: string | null | undefined) => (e === '' ? null : e));

// Helper for optional URL string that can be null or empty
const optionalUrl = z
  .string()
  .url('Must be a valid URL')
  .nullable()
  .optional()
  .transform((e: string | null | undefined) => (e === '' ? null : e));

const ArticleSchema = z.object({
  slug: z
    .string()
    .min(1, 'URL Slug is required.')
    .regex(
      // eslint-disable-next-line security/detect-unsafe-regex -- This is a standard and safe slug regex pattern.
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'URL Slug must be lowercase, alphanumeric, and use hyphens for spaces (e.g., my-awesome-article).'
    ),
  contentType: z.enum(['editorial', 'briefing']).default('editorial'),
  status: z.enum(['pending_review', 'published', 'content_incomplete']).default('pending_review'),
  title: z.string().min(1, 'Article Title is required.'),
  author: z.string().min(1, 'Author is required.'),
  publishDate: z.string().min(1, 'Publish Date is required.'),
  contentBody: z
    .string()
    .min(1, 'Article Content is required.')
    .refine((data: string) => data !== '<p><br></p>', 'Article Content is required.'),
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
  sourceName: optionalString,
  originalUrl: optionalUrl,
}).superRefine((data: { contentType: string; sourceName?: string | null; originalUrl?: string | null }, ctx: z.RefinementCtx) => {
  if (data.contentType === 'briefing') {
    if (!data.sourceName) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Source Name is required for Briefings.',
        path: ['sourceName'],
      });
    }
    if (!data.originalUrl) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Original URL is required for Briefings.',
        path: ['originalUrl'],
      });
    }
  }
});

const SeedArticleSchema = z.object({
  slug: z.string(),
  contentType: z.enum(['editorial', 'briefing']),
  sourceName: z.string().optional(),
  originalUrl: z.string().url().optional(),
  title: z.string(),
  author: z.string(),
  publishDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  issueNo: z.number().optional(),
  volumeNo: z.number().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  hub: z.string().optional(),
  excerpt: z.string(),
  author_take_question1: z.string().optional(),
  author_take_answer1: z.string().optional(),
  author_take_question2: z.string().optional(),
  author_take_answer2: z.string().optional(),
  contentBody: z.string().optional(),
});

const SeedJobPostingSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  applicationLink: z.string().url(),
  postedDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  expirationDate: z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable().optional(),
  tags: z.array(z.string()).optional(), // Key difference: expects an array
  status: z.string(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  jobLevel: z.string().nullable().optional(),
  employeeRole: z.string().nullable().optional(),
  salaryRange: z.string().nullable().optional(),
  hasSalary: z.boolean().optional(),
  source: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  verificationDate: z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable().optional(),
  glassdoorLink: z.string().url().nullable().optional(),
  crunchbaseLink: z.string().url().nullable().optional(),
  companyLogoUrl: z.string().nullable().optional(),
  applicationExperience: z.string().optional(),
  excerpt: z.string(),
  description: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  story_question1: z.string().optional(),
  story_answer1: z.string().optional(),
  story_question2: z.string().optional(),
  story_answer2: z.string().optional(),
  story_question3: z.string().optional(),
  story_answer3: z.string().optional(),
  companyCulture: z.string().optional(),
});

const JobPostingSchema = z
  .object({
    id: z.string().optional(), // ID is optional for new jobs
    title: z.string().min(1, 'Job Title is required.'),
    company: z.string().min(1, 'Company is required.'),
    companyLogoUrl: optionalUrl.optional(),
    description: z
      .string()
      .min(1, 'Job Description is required.')
      .refine((data: string) => data !== '<p><br></p>', 'Job Description is required.'),
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
      .enum(['draft', 'pending_review', 'pending_approval', 'published', 'rejected'])
      .default('draft'),
    isNew: z.boolean().default(true),
    isFeatured: z.boolean().optional(),
    source: optionalString,
    sourceUrl: optionalUrl,
    verificationDate: z.string().nullable().optional(), // Keep as string for form input
    glassdoorLink: optionalUrl,
    crunchbaseLink: optionalUrl,
    story_question1: z.string().min(1, 'Human Context Question is required when providing an answer.').optional().nullable(),
    story_answer1: z.string()
      .min(200, 'Human Context Q&A must be at least 200 characters.')
      .refine((val: string) => {
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
    (data: { postedDate?: string; expirationDate?: string | null }) => {
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

module.exports = {
    ArticleSchema,
    SeedArticleSchema,
    SeedJobPostingSchema,
    JobPostingSchema
}