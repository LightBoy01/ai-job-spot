
import matter from 'gray-matter';
import { promises as fs } from 'fs';
import path from 'path';
import { StandardJob, StandardJobSchema } from './types.ts';

const OUTPUT_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');

/**
 * Writes a standardized job object to a Markdown file with YAML frontmatter.
 * @param job The standardized job object.
 */
export async function writeJobFile(job: StandardJob): Promise<void> {
  // 1. Validate the job object before writing
  const validationResult = StandardJobSchema.safeParse(job);
  if (!validationResult.success) {
    console.error(`[Writer] Invalid job object for "${job.title}". Skipping file write.`, validationResult.error);
    throw new Error('Invalid job data provided to writer.');
  }

  const { description, responsibilities, qualifications, ...frontmatterData } = job;

  // 2. Construct the Markdown body
  let body = description;
  if (responsibilities.length > 0) {
    body += '\n\n### Responsibilities\n\n' + responsibilities.map(r => `- ${r}`).join('\n');
  }
  if (qualifications.length > 0) {
    body += '\n\n### Qualifications\n\n' + qualifications.map(q => `- ${q}`).join('\n');
  }

  // 3. Use gray-matter to create the final file content
  const fileContent = matter.stringify(body, frontmatterData);

  // 4. Create a unique and descriptive filename
  const filename = `${job.id}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  await fs.writeFile(filePath, fileContent, 'utf-8');
  console.log(`[Writer] Successfully wrote job file: ${filename}`);
}
