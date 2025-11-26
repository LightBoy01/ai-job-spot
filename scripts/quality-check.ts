import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { StandardJobSchema, StandardBriefingSchema } from '../src/data-pipeline/types.js';

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const BRIEFING_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');

let totalFiles = 0;
let filesWithErrors = 0;

async function checkFile<T>(filePath: string, schema: z.ZodSchema<T>, requiredHeaders: string[]) {
    totalFiles++;
    let hasError = false;

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        // 1. Validate frontmatter against schema
        const validationResult = schema.safeParse(data);
        if (!validationResult.success) {
            hasError = true;
        }

        // 2. Check for required headers in markdown body
        const missingHeaders = requiredHeaders.filter(header => !content.includes(header));
        if (missingHeaders.length > 0) {
            hasError = true;
        }

        if (hasError) {
            filesWithErrors++;
            console.log(`❌ ${path.basename(filePath)}`);
        }

    } catch (error) {
        filesWithErrors++;
        console.log(`❌ ${path.basename(filePath)} (Error reading or parsing)`);
    }
}

async function qualityCheck() {
    console.log('Starting quality check...');

    // Check Jobs
    console.log('--- Checking Job Descriptions ---');
    const jobFiles = await fs.readdir(JOB_DIR);
    for (const file of jobFiles) {
        if (file.endsWith('.md')) {
            await checkFile(
                path.join(JOB_DIR, file),
                StandardJobSchema,
                ['### Description', '### Responsibilities', '### Qualifications']
            );
        }
    }

    // Check Briefings
    console.log('--- Checking Briefings ---');
    const briefingFiles = await fs.readdir(BRIEFING_DIR);
    for (const file of briefingFiles) {
        if (file.endsWith('.md')) {
            await checkFile(
                path.join(BRIEFING_DIR, file),
                StandardBriefingSchema,
                ['### Summary', '### Why It Matters']
            );
        }
    }

    console.log('--- Quality Check Complete ---');
    console.log(`Total files checked: ${totalFiles}`);
    console.log(`Files with errors: ${filesWithErrors}`);

    if (filesWithErrors > 0) {
        process.exit(1);
    }
}

qualityCheck();
