import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import slugify from 'slugify';
import { StandardJobSchema, StandardBriefingSchema } from '../src/data-pipeline/types.js';
import { enrichJobData } from './enrich_jobs.js';
import { enrichBriefingData } from './enrich_briefings.js';
import { parseJobMarkdownFromContent } from './utils/job-markdown-parser.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const BRIEFING_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const isDryRun = process.argv.includes('--dry-run');

type ContentType = 'jobs' | 'briefings';
type EnricherFunction = (content: string, title?: string) => Promise<any>;

async function repair(
    contentType: ContentType,
    directory: string,
    schema: z.ZodSchema<any>,
    enricher: EnricherFunction
) {
    console.log(`\n--- [START] Repairing ${contentType.toUpperCase()} ---`);
    if (isDryRun) console.log('--- DRY RUN MODE: No files will be written. ---\n');

    const summary = {
        totalFiles: 0,
        invalidFilesFound: 0,
        successfullyRepaired: 0,
        skipped: 0,
        failed: 0,
    };

    const allFiles = await fs.readdir(directory);
    summary.totalFiles = allFiles.length;
    
    const invalidFiles = [];

    console.log('Scanning for invalid files...');
    for (const file of allFiles) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(directory, file);
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const { data } = matter(fileContent);
            if (!schema.safeParse(data).success) {
                invalidFiles.push(file); // Push just the filename
            }
        } catch (error) {
            console.warn(`Could not read or parse ${file} during scan. Skipping.`, error);
        }
    }

    summary.invalidFilesFound = invalidFiles.length;
    summary.skipped = summary.totalFiles - summary.invalidFilesFound;
    console.log(`Found ${summary.invalidFilesFound} files needing repair.`);

    let filesToProcess = invalidFiles;

    // --- Corrected Limit Logic ---
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    if (limitArg) {
        const limitValue = parseInt(limitArg.split('=')[1], 10);
        if (!isNaN(limitValue) && limitValue > 0) {
            const limit = Math.min(limitValue, 100); // Enforce max limit of 100
            if (filesToProcess.length > limit) {
                console.log(`Applying limit. Processing ${limit} of ${filesToProcess.length} invalid files.`);
                filesToProcess = filesToProcess.slice(0, limit);
            }
        }
    }
    // --- End Corrected Limit Logic ---

    for (const file of filesToProcess) {
        const filePath = path.join(directory, file);
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            console.log(`⚠️ File ${file} is invalid. Attempting repair...`);

            const enrichedData = await enricher(content, data.title || file);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping repair for ${file} due to incomplete AI response.`);
                summary.failed++;
                continue;
            }

            const newBody = enrichedData.markdownBody;
            let newFrontmatter: Record<string, any> = { ...data };

            if (contentType === 'jobs') {
                newFrontmatter = { ...newFrontmatter, ...enrichedData.frontmatterFields };
                const parsedBody = await parseJobMarkdownFromContent(newBody);
                Object.assign(newFrontmatter, parsedBody);
            } else { // Briefings
                newFrontmatter.title = enrichedData.frontmatterFields.suggestedTitle || newFrontmatter.title;
                const existingTags = new Set((newFrontmatter.tags || []).map((t: string) => t.trim()));
                const suggestedTags = (enrichedData.frontmatterFields.suggestedTags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                suggestedTags.forEach((tag: string) => existingTags.add(tag));
                newFrontmatter.tags = Array.from(existingTags);

                // --- NEW REPAIR LOGIC ---
                const title = newFrontmatter.title || 'Untitled Briefing';
                
                // Handle potential CJS/ESM interop issues with slugify
                type SlugifyFunc = (text: string, options?: object) => string;
                const slugifyModule = slugify as { default: SlugifyFunc } | SlugifyFunc;
                const slugifyFn = typeof slugifyModule === 'function' ? slugifyModule : slugifyModule.default;
                const generatedSlug = slugifyFn(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
                
                const idMatch = file.match(/briefing-(.*)\.md/);
                newFrontmatter.id = newFrontmatter.id || (idMatch ? `briefing-${idMatch[1]}` : `briefing-${generatedSlug}`);
                newFrontmatter.slug = newFrontmatter.slug || generatedSlug;
                newFrontmatter.author = newFrontmatter.author || 'AI Job Spot Staff';
                newFrontmatter.publishDate = newFrontmatter.publishDate || new Date();
                newFrontmatter.contentType = 'briefing';
                newFrontmatter.sourceName = newFrontmatter.sourceName || 'Unknown Source';
                newFrontmatter.originalUrl = newFrontmatter.originalUrl || `https://aijobspot.online/placeholder/${newFrontmatter.id}`;
                newFrontmatter.status = newFrontmatter.status || 'pending_approval';
                newFrontmatter.excerpt = newFrontmatter.excerpt || newBody.substring(0, 200).replace(/\r?\n/g, ' ');
                newFrontmatter.content = newBody;
                // --- END NEW REPAIR LOGIC ---
            }

            const objectToValidate = { ...newFrontmatter };
            if (contentType === 'briefings') {
                objectToValidate.content = newBody;
            }
            
            const finalValidation = schema.safeParse(objectToValidate);

            if (!finalValidation.success) {
                console.error(`❌ [VALIDATION FAILED] for ${file} after repair attempt. File will not be written.`);
                console.error('Reason:', finalValidation.error.flatten().fieldErrors);
                summary.failed++;
                continue; // Skip writing the file
            }

            if (contentType === 'briefings') {
                delete finalValidation.data.content;
            }
            
            const newFileContent = matter.stringify(newBody, finalValidation.data);

            if (isDryRun) {
                console.log(`---\n[DRY RUN] Would write the following to ${file}:\n---\n${newFileContent}\n---\n`);
            } else {
                await fs.writeFile(filePath, newFileContent, 'utf8');
                console.log(`✅ Successfully repaired and validated ${file}.`);
            }
            summary.successfullyRepaired++;

            if (filesToProcess.indexOf(file) < filesToProcess.length - 1) {
                console.log('Waiting for 15 seconds before the next file...');
                await new Promise(resolve => setTimeout(resolve, 15000));
            }

        } catch (error) {
            console.error(`❌ Failed to process file ${file}. Error:`, error);
            summary.failed++;
        }
    }
    console.log(`\n--- [END] Repairing ${contentType.toUpperCase()} ---`);
    console.log('--- Final Summary ---');
    console.log(`Total Files Checked: ${summary.totalFiles}`);
    console.log(`Invalid Files Found: ${summary.invalidFilesFound}`);
    console.log(`✅ Successfully Repaired: ${summary.successfullyRepaired}`);
    console.log(`⏭️ Skipped (already valid): ${summary.skipped}`);
    console.log(`❌ Failed to Repair: ${summary.failed}`);
    console.log('-----------------------\n');
}

async function main() {
    console.log('\n--- [START] Content Repair Script ---');
    if (process.env.AI_API_KEY) {
      console.log("✅ AI_API_KEY found in environment. AI enrichment will proceed.");
    } else {
      console.log("⚠️ WARNING: AI_API_KEY not found. AI enrichment will use simulated data.");
    }
    console.log('-------------------------------------\n');

    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    const target = args[0] as ContentType | undefined;

    if (target === 'jobs') {
        await repair('jobs', JOB_DIR, StandardJobSchema, (content) => enrichJobData(content));
    } else if (target === 'briefings') {
        await repair('briefings', BRIEFING_DIR, StandardBriefingSchema, (content, title) => enrichBriefingData(content, title || ''));
    } else {
        console.log('No specific target specified. Running repair for both jobs and briefings.');
        await repair('jobs', JOB_DIR, StandardJobSchema, (content) => enrichJobData(content));
        await repair('briefings', BRIEFING_DIR, StandardBriefingSchema, (content, title) => enrichBriefingData(content, title || ''));
    }
    console.log('--- [END] Content Repair Script ---');
}

main();
