import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type { JobPosting } from '../src/lib/types.ts';

import dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config({ path: '.env.local' });

const EnrichedJobDataSchema = z.object({
  frontmatterFields: z.object({
    jobLevel: z.string().nullable(),
    employeeRole: z.string().nullable(),
    salaryRange: z.string().nullable(),
    companyCulture: z.string().nullable(),
    story_question1: z.string(),
    story_answer1: z.string(),
    story_question2: z.string().nullable().optional(),
    story_answer2: z.string().nullable().optional(),
    story_question3: z.string().nullable().optional(),
    story_answer3: z.string().nullable().optional(),
  }),
  markdownBody: z.string(),
});

type EnrichedJobData = z.infer<typeof EnrichedJobDataSchema>;

import { callGeminiApi } from '../src/data-pipeline/utils/ai.js';
import { sanitizeAndParseJson } from './utils/ai-response-parser.js';

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');


interface PendingJob {
  filePath: string;
  frontmatter: { [key: string]: unknown };
  content: string;
}

async function getPendingJobs(): Promise<PendingJob[]> {
  console.log("Scanning for jobs with status 'pending_review'...");
  const pendingJobs: PendingJob[] = [];
  const files = await fs.readdir(JOB_DIR);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(JOB_DIR, file);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      if (data.status === 'pending_review') {
        pendingJobs.push({ filePath, frontmatter: data, content });
      }
    } catch (error) {
        console.warn(`Could not process file ${file}. Skipping.`, error)
    }
  }
  
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  let limit = 25; // Default limit

  if (limitArg) {
      const limitValue = parseInt(limitArg.split('=')[1], 10);
      if (!isNaN(limitValue) && limitValue > 0) {
          limit = Math.min(limitValue, 100); // Enforce max limit of 100
      }
  }
  
  console.log(`Found ${pendingJobs.length} total pending jobs.`);
  const jobsToProcess = pendingJobs.slice(0, limit);

  if (pendingJobs.length > limit) {
    console.log(`This run will be limited to processing ${limit} jobs.`);
  }
  return jobsToProcess;
}

export async function enrichJobData(jobContent: string): Promise<EnrichedJobData | null> {
    console.log("Sending content to AI for enrichment...");
    
    if (!process.env.AI_API_KEY) {
        console.warn("AI_API_KEY environment variable not set. Using simulated AI response.");
        // SIMULATED AI RESPONSE
        return {
            frontmatterFields: {
                jobLevel: "Mid-Senior",
                employeeRole: "Individual Contributor",
                salaryRange: "$140,000 - $190,000",
                companyCulture: "A fast-paced and collaborative environment.",
                story_question1: "What's the biggest challenge in this role?",
                story_answer1: "The biggest challenge is balancing innovation with existing system stability.",
                story_question2: null,
                story_answer2: null,
                story_question3: null,
                story_answer3: null,
            },
            markdownBody: `### Description\nThis is a simulated description.\n\n### Responsibilities\n- Lead product discovery.\n- Prioritize roadmap.\n\n### Qualifications\n- 3+ years of PM experience.\n- Strong communication skills.`
        };
    }

    const prompt = `
      Analyze the following job description text. Your task is to clean, structure, and enrich it. 
      Return ONLY a single, valid JSON object with two top-level keys: "frontmatterFields" and "markdownBody".

      1.  **frontmatterFields**: An object containing these exact keys:
          - "jobLevel": Infer the job level. Choose one of: ["Entry-Level", "Junior", "Mid-Senior", "Senior", "Lead", "Principal", "Director", "Executive"]. If unsure, use null.
          - "employeeRole": Infer the employee role. Choose one of: ["Individual Contributor", "Manager", "Lead"]. If unsure, use null.
          - "salaryRange": If a salary is mentioned, extract it as a string (e.g., "$150,000 - $200,000"). If not mentioned, use null.
          - "companyCulture": Based on the text, infer the company culture in 1-2 sentences. Focus on work-life balance, collaboration, and growth opportunities. If unsure, use null.
          - "story_question1": Generate an insightful question a candidate might ask about the role's impact or challenges.
          - "story_answer1": Provide a compelling, narrative-style answer to story_question1, revealing the role's impact and the company culture, framed as if an insider is sharing their perspective.
          - "story_question2": Generate a second insightful question. If not applicable, use null.
          - "story_answer2": Provide a compelling, narrative-style answer to story_question2. If not applicable, use null.
          - "story_question3": (Optional) Generate a third insightful question. If not applicable, use null.
          - "story_answer3": (Optional) Provide a compelling, narrative-style answer to story_question3. If not applicable, use null.

      2.  **markdownBody**: A single string containing the full, rewritten job description in well-formatted Markdown. It MUST include the following sections using '###' headers:
          - ### Description
          - ### Responsibilities
          - ### Qualifications
          - ### Author's Take

      IMPORTANT: The entire output MUST be a single, valid JSON object. The markdownBody value must be a single-line string with all special characters properly escaped.

      EXAMPLE of a valid markdownBody value:
      "markdownBody": "### Description\\nThis is a summary.\\n\\n### Responsibilities\\n- Do this.\\n- Do that.\\n\\n### Qualifications\\n- Experience with \\"things\\".\\n- Knowledge of \\"stuff\\".\\n\\n### Author's Take\\nThis is a great role."

      Pay close attention to escaping all double quotes (") with (\\") and all newline characters with (\\n) within the markdownBody string value.

      Do not add any fields that are not requested.

      JOB DESCRIPTION TEXT TO ANALYZE:
      ${jobContent}

      JSON OUTPUT:
    `;

    const aiResponseText = await callGeminiApi(prompt);

    if (!aiResponseText) {
        return null;
    }

    return sanitizeAndParseJson(aiResponseText, EnrichedJobDataSchema);
}


function summarizeChanges(oldFrontmatter: Record<string, unknown>, newFrontmatter: Record<string, unknown>, oldBody: string, newBody: string): string {
    const changes: string[] = [];

    // 1. Check frontmatter changes, ignoring status
    const keysToCompare = Object.keys(newFrontmatter).filter(key => key !== 'status');

    for (const key of keysToCompare) {
        if (oldFrontmatter[key] !== newFrontmatter[key]) {
            if (oldFrontmatter[key] === null || oldFrontmatter[key] === undefined || oldFrontmatter[key] === '') {
                changes.push(`- ✨ Enriched '${key}' with a new value.`);
            } else {
                changes.push(`- ✏️ Updated '${key}'.`);
            }
        }
    }

    // 2. Check body changes
    if (oldBody.trim() !== newBody.trim()) {
        changes.push("- 🔄 Body content was rewritten and formatted by the AI.");
    }

    if (changes.length === 0) {
        return "No significant changes were made.";
    }

    return "\n📊 Summary of Changes:\n" + changes.join("\n");
}

async function enrichJobs() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log('\n--- [START] Job Enrichment Script ---');
    if (isDryRun) {
        console.log('--- DRY RUN MODE: No files will be written. ---\n');
    }

    const jobsToProcess = await getPendingJobs();
    const summary = {
        totalFound: jobsToProcess.length,
        successfullyProcessed: 0,
        skipped: 0,
        failed: 0,
    };

    if (summary.totalFound === 0) {
        console.log('No pending jobs found to process.');
        console.log('--- [END] Job Enrichment Script ---');
        return;
    }

    for (const job of jobsToProcess) {
        const jobIndex = jobsToProcess.indexOf(job) + 1;
        const fileName = path.basename(job.filePath);
        console.log(`\n--- [${jobIndex}/${summary.totalFound}] Processing: ${fileName} ---`);

        try {
            const enrichedData = await enrichJobData(job.content);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping file ${fileName} due to incomplete AI response.`);
                summary.skipped++;
                continue;
            }

            // "Enrich, Don't Overwrite" Logic for frontmatter fields
            const newFrontmatter = { ...job.frontmatter };
            for (const key of Object.keys(enrichedData.frontmatterFields) as Array<keyof typeof enrichedData.frontmatterFields>) {
                const value = enrichedData.frontmatterFields[key];
                if (value !== null && value !== undefined) {
                    if (newFrontmatter[key] === null || newFrontmatter[key] === undefined || newFrontmatter[key] === '') {
                        newFrontmatter[key] = value;
                    }
                }
            }
            
            newFrontmatter.status = 'pending_approval'; // Status always updates

            const newBody = enrichedData.markdownBody;
            const newFileContent = matter.stringify(newBody, newFrontmatter);

            const changesSummary = summarizeChanges(job.frontmatter, newFrontmatter, job.content, newBody);
            console.log(changesSummary);

            if (isDryRun) {
              console.log(`\n--- DRY RUN: Changes for ${fileName} ---`);
              console.log(newFileContent);
              console.log(`--- END DRY RUN: ${fileName} ---\n`);
            } else {
              await fs.writeFile(job.filePath, newFileContent, 'utf8');
              console.log(`✅ Successfully enriched and updated ${fileName}`);
            }
            summary.successfullyProcessed++;
            
        } catch (error) {
            console.error(`❌ Failed to process file ${fileName}. Error:`, error);
            summary.failed++;
        }
    
        if (jobsToProcess.indexOf(job) < jobsToProcess.length - 1) {
            console.log('Waiting for 15 seconds before the next job...');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    console.log('\n--- [END] Job Enrichment Script ---');
    console.log('--- Final Summary ---');
    console.log(`Total Jobs Found: ${summary.totalFound}`);
    console.log(`✅ Successfully Processed: ${summary.successfullyProcessed}`);
    console.log(`⏭️ Skipped: ${summary.skipped}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log('-----------------------\n');
}

import { fileURLToPath } from 'url';

// ... (rest of the file)

async function main() {
    const isMainModule = process.argv[1] && fileURLToPath(import.meta.url).endsWith(process.argv[1]);

    if (isMainModule) {
        await enrichJobs();
    }
}

main().catch(error => {
    console.error("An unexpected error occurred during job enrichment:", error);
    process.exit(1);
});


