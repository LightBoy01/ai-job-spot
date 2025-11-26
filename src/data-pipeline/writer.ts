
import matter from 'gray-matter';
import { promises as fs } from 'fs';
import path from 'path';
import { StandardJob, StandardJobSchema, StandardBriefing, StandardBriefingSchema } from './types.js';
import DOMPurify from 'isomorphic-dompurify';
import logger from './utils/logger.js';
import slugify from 'slugify';

const JOB_OUTPUT_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const BRIEFING_OUTPUT_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');

function createSlug(text: string): string {
  // Handle potential CJS/ESM interop issues with slugify
  type SlugifyFunc = (text: string, options?: object) => string;
  const slugifyModule = slugify as { default: SlugifyFunc } | SlugifyFunc;
  const slugifyFn = typeof slugifyModule === 'function' ? slugifyModule : slugifyModule.default;

  return slugifyFn(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

/**
 * Writes a standardized job object to a Markdown file with YAML frontmatter.
 * @param job The standardized job object.
 */
export async function writeJobFile(job: StandardJob, hashId: string): Promise<void> {
  // 1. Validate the job object before writing
  const validationResult = StandardJobSchema.safeParse(job);
  if (!validationResult.success) {
    logger.error({ err: validationResult.error, jobTitle: job.title }, `[Writer] Invalid job object. Skipping file write.`);
    throw new Error('Invalid job data provided to writer.');
  }

  const { description, responsibilities, qualifications, ...frontmatterData } = job;
  frontmatterData.id = hashId; // Explicitly set the ID in frontmatter to the hashId

  // --- NEW: Sanitize and URL-decode the description ---
  let cleanedDescription = description;
  try {
    // First, URL-decode the content
    cleanedDescription = decodeURIComponent(cleanedDescription);
  } catch {
    // If decoding fails, it might not be encoded, proceed with raw content
    logger.warn({ jobId: job.id }, `[Writer] Could not decode description for job. Proceeding with raw content.`);
  }
  // Then, sanitize the HTML content
  cleanedDescription = DOMPurify.sanitize(cleanedDescription, { USE_PROFILES: { html: true } });
  // --- END NEW ---

  // --- NEW: Sanitize frontmatter string values ---
  const frontmatterToSanitize = frontmatterData as Record<string, unknown>;
  /* eslint-disable security/detect-object-injection */
  for (const key of Object.keys(frontmatterToSanitize)) {
    if (typeof frontmatterToSanitize[key] === 'string') {
      // This is safe because the keys are derived from a Zod schema, not user input.
      frontmatterToSanitize[key] = (frontmatterToSanitize[key] as string).replace(/\r?\n/g, ' ').trim();
    }
  }
  /* eslint-enable security/detect-object-injection */
  // --- END NEW ---

  // 2. Construct the Markdown body using the cleanedDescription
  let body = cleanedDescription;
  if (responsibilities && responsibilities.length > 0) {
    body += '\n\n### Responsibilities\n\n' + responsibilities.map(r => `- ${r}`).join('\n');
  }
  if (qualifications && qualifications.length > 0) {
    body += '\n\n### Qualifications\n\n' + qualifications.map(q => `- ${q}`).join('\n');
  }

  // 3. Use gray-matter to create the final file content
  const fileContent = matter.stringify(body, frontmatterData);

  // 4. Create a unique and descriptive filename
  const companySlug = createSlug(job.company);
  const titleSlug = createSlug(job.title);
  const filename = `${hashId}-${companySlug}-${titleSlug}.md`;
  const filePath = path.join(JOB_OUTPUT_DIR, filename);

  // Security: Ensure the final file path is within the intended output directory
  if (!path.resolve(filePath).startsWith(path.resolve(JOB_OUTPUT_DIR))) {
      logger.error({ filePath }, `[Writer] CRITICAL: Invalid job data resulted in path traversal attempt. Aborting file write.`);
      throw new Error('Invalid file path detected.');
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated above
  await fs.writeFile(filePath, fileContent, 'utf-8');
  logger.info({ file: filename }, `[Writer] Successfully wrote job file.`);
}

/**
 * Writes a standardized briefing object to a Markdown file with YAML frontmatter.
 * @param briefing The standardized briefing object.
 */
export async function writeBriefingFile(briefing: StandardBriefing, id: string): Promise<void> {
    // 1. Validate
    const validationResult = StandardBriefingSchema.safeParse(briefing);
    if (!validationResult.success) {
        logger.error({ err: validationResult.error, briefingTitle: briefing.title }, `[Writer] Invalid briefing object. Skipping file write.`);
        throw new Error('Invalid briefing data provided to writer.');
    }

    const { content, ...frontmatterData } = briefing;
    const filename = `${id}.md`;
    const filePath = path.join(BRIEFING_OUTPUT_DIR, filename);

    // Security: Ensure the final file path is within the intended output directory
    if (!path.resolve(filePath).startsWith(path.resolve(BRIEFING_OUTPUT_DIR))) {
        logger.error({ filePath }, `[Writer] CRITICAL: Invalid briefing data resulted in path traversal attempt. Aborting file write.`);
        throw new Error('Invalid file path detected.');
    }

    // 2. Sanitize content
    const sanitizedContent = DOMPurify.sanitize(content || '', { USE_PROFILES: { html: true } });

    // 3. Sanitize frontmatter
    const frontmatterToSanitize = frontmatterData as Record<string, unknown>;
    /* eslint-disable security/detect-object-injection */
    for (const key of Object.keys(frontmatterToSanitize)) {
        // Sanitize all string fields except 'excerpt' which can be multi-line
        if (typeof frontmatterToSanitize[key] === 'string' && key !== 'excerpt') {
            // This is safe because the keys are from a Zod schema, not user input.
            frontmatterToSanitize[key] = (frontmatterToSanitize[key] as string).replace(/\r?\n/g, ' ').trim();
        }
        // Sanitize strings within the tags array
        if (key === 'tags' && Array.isArray(frontmatterToSanitize[key])) {
            // This is safe for the same reason.
            frontmatterToSanitize[key] = (frontmatterToSanitize[key] as string[]).map(tag => tag.replace(/\r?\n/g, ' ').trim());
        }
    }
    /* eslint-enable security/detect-object-injection */

    // 4. Construct final file
    const warningComment = `<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->`;
    const fileContentWithWarning = matter.stringify(sanitizedContent, frontmatterData);
    const finalContent = `${warningComment}\n\n${fileContentWithWarning}`;

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated above
    await fs.writeFile(filePath, finalContent, 'utf-8');
    logger.info({ file: filename }, `[Writer] Successfully wrote briefing file.`);
}
