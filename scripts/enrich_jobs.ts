import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type { JobPosting } from '../src/lib/types.ts';
import { gotScraping } from 'got-scraping';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');
const ENRICH_BATCH_SIZE = 5;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.AI_API_KEY}`;

interface PendingJob {
  filePath: string;
  frontmatter: { [key: string]: any };
  content: string;
}

async function getPendingJobs(): Promise<PendingJob[]> {
  console.log(`Scanning for all jobs with status 'pending_review'...`);
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
  
  console.log(`Found ${pendingJobs.length} total jobs to process.`);
  return pendingJobs;
}

async function enrichJobData(jobContent: string): Promise<any | null> {
    console.log(`Enriching job content...`);
    
    if (!process.env.AI_API_KEY) {
        console.warn("AI_API_KEY environment variable not set. Using simulated AI response.");
        // SIMULATED AI RESPONSE
        return {
            frontmatterFields: {
                jobLevel: "Mid-Senior",
                employeeRole: "Individual Contributor",
                salaryRange: "$140,000 - $190,000",
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

      2.  **markdownBody**: A single string containing the full, rewritten job description in well-formatted Markdown. It MUST include the following sections using '###' headers:
          - ### Description
          - ### Responsibilities
          - ### Qualifications
          - ### Author's Take

      For the "Author's Take" section, generate two insightful questions a candidate might ask and provide compelling, narrative-style answers that reveal the role's impact and the company culture. Frame it as if an insider is sharing their perspective.

      Do not add any fields that are not requested. The entire output must be a single JSON object.

      JOB DESCRIPTION TEXT TO ANALYZE:
      """
      ${jobContent}
      """

      JSON OUTPUT:
    `;

    try {
        const response = await gotScraping.post({
            url: GEMINI_API_URL,
            json: {
                contents: [{ parts: [{ text: prompt }] }],
            },
            responseType: 'json'
        });

        const aiResponseText = response.body.candidates[0].content.parts[0].text;
        // Clean the response to ensure it is valid JSON
        const cleanedJsonString = aiResponseText.replace(/^```json\n|```$/g, '').trim();
        const enrichedData = JSON.parse(cleanedJsonString);
        return enrichedData;

    } catch (error: any) {
        console.error("Error calling AI API:", error.response ? error.response.body : error.message);
        return null;
    }
}

function summarizeChanges(oldFrontmatter: any, newFrontmatter: any, oldBody: string, newBody: string): string {
    const changes: string[] = [];

    // 1. Check frontmatter changes
    for (const key in newFrontmatter) {
        if (oldFrontmatter[key] !== newFrontmatter[key]) {
            if (oldFrontmatter[key] === null || oldFrontmatter[key] === undefined || oldFrontmatter[key] === '') {
                changes.push(`- ✨ Enriched 
${key}
 with a new value.`);
            } else {
                changes.push(`- ✏️ Updated 
${key}
.`);
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

    // Filter out status update unless it's the only change
    if (changes.length > 1) {
        const statusChangeIndex = changes.findIndex(c => c.includes("Updated `status`"));
        if (statusChangeIndex > -1) {
            changes.splice(statusChangeIndex, 1);
        }
    }

    return "\n📊 Summary of Changes:\n" + changes.join("\n");
}

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('--- DRY RUN MODE: No files will be written. ---');
}

async function enrichJobs() {
    let totalProcessed = 0;
    const jobsToProcess = await getPendingJobs();

    if (jobsToProcess.length === 0) {
        console.log('No pending jobs found to process.');
        return; // Exit early
    }

    for (const job of jobsToProcess) {
        try {
            console.log(`Processing file: ${path.basename(job.filePath)}`);
            const enrichedData = await enrichJobData(job.content);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping file ${path.basename(job.filePath)} due to incomplete AI response.`);
                continue;
            }

            // "Enrich, Don't Overwrite" Logic for frontmatter fields
            const newFrontmatter = { ...job.frontmatter };
            for (const key in enrichedData.frontmatterFields) {
                const value = enrichedData.frontmatterFields[key];
                if (Object.prototype.hasOwnProperty.call(enrichedData.frontmatterFields, key) && value !== null && value !== undefined) {
                    // Only update if the original field is missing or empty
                    if (newFrontmatter[key] === null || newFrontmatter[key] === undefined || newFrontmatter[key] === '') {
                        newFrontmatter[key] = value;
                    }
                }
            }
            newFrontmatter.status = 'pending_approval'; // Status always updates

            // The new body is the AI-generated markdown
            const newBody = enrichedData.markdownBody;

            const newFileContent = matter.stringify(newBody, newFrontmatter);

            const summary = summarizeChanges(job.frontmatter, newFrontmatter, job.content, newBody);
            console.log(summary);

            if (isDryRun) {
              console.log(`\n--- DRY RUN: Changes for ${path.basename(job.filePath)} ---`);
              console.log(newFileContent);
              console.log(`--- END DRY RUN: ${path.basename(job.filePath)} ---\n`);
            } else {
              await fs.writeFile(job.filePath, newFileContent, 'utf8');
              console.log(`Successfully enriched and updated ${path.basename(job.filePath)}`);
            }
                            totalProcessed++;
            
                        } catch (error) {
                            console.error(`Failed to process file ${path.basename(job.filePath)}. Error:`, error);
                        }
            
                        // Add a 3-second delay between requests to avoid rate limiting
                        if (jobsToProcess.indexOf(job) < jobsToProcess.length - 1) {
                            console.log('Waiting for 3 seconds before the next job...');
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                    }    console.log(`\nEnrichment script finished. ${isDryRun ? '(DRY RUN)' : ''} Processed a total of ${totalProcessed} jobs.`);
}

// --- EXECUTION BLOCK ---
if (process.env.NODE_ENV !== 'test') {
    enrichJobs()
      .then(() => {
        console.log('\nJob enrichment process completed successfully.\n');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\nJob enrichment process failed.\n', error);
        process.exit(1);
      });
}
