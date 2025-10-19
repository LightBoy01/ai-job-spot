
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
  return slugify(text, {
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
  for (const key of Object.keys(frontmatterToSanitize)) {
    if (typeof frontmatterToSanitize[key] === 'string') {
      frontmatterToSanitize[key] = frontmatterToSanitize[key].replace(/\r?\n/g, ' ').trim();
    }
  }
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

    // 2. Sanitize content
    const sanitizedContent = DOMPurify.sanitize(content || '', { USE_PROFILES: { html: true } });

    // 3. Sanitize frontmatter
    const frontmatterToSanitize = frontmatterData as Record<string, unknown>;
    for (const key of Object.keys(frontmatterToSanitize)) {
        // Sanitize all string fields except 'excerpt' which can be multi-line
        if (typeof frontmatterToSanitize[key] === 'string' && key !== 'excerpt') {
            frontmatterToSanitize[key] = (frontmatterToSanitize[key] as string).replace(/\r?\n/g, ' ').trim();
        }
        // Sanitize strings within the tags array
        if (key === 'tags' && Array.isArray(frontmatterToSanitize[key])) {
            frontmatterToSanitize[key] = (frontmatterToSanitize[key] as string[]).map(tag => tag.replace(/\r?\n/g, ' ').trim());
        }
    }

    // 4. Construct final file
    const warningComment = `<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->`;
    const fileContentWithWarning = matter.stringify(sanitizedContent, frontmatterData);
    const finalContent = `${warningComment}\n\n${fileContentWithWarning}`;

    await fs.writeFile(filePath, finalContent, 'utf-8');
    logger.info({ file: filename }, `[Writer] Successfully wrote briefing file.`);
}
