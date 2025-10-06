const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { getAiProvider } = require('../src/lib/ai/client.cts');

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');

interface PendingJob {
  filePath: string;
  frontmatter: { [key: string]: any };
  content: string;
}

async function getPendingJobs(limit = -1): Promise<PendingJob[]> {
  console.log(`Scanning for jobs with status 'pending_review'...`);
  const pendingJobs: PendingJob[] = [];
  try {
    const files = await fs.readdir(JOB_DIR);
    for (const file of files) {
      if (limit > 0 && pendingJobs.length >= limit) {
        console.log(`Reached processing limit of ${limit}.`);
        break;
      }
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
  } catch (error) {
      // It's okay if the directory doesn't exist.
      if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Error reading jobs directory: ${JOB_DIR}`, error);
      }
  }
  
  console.log(`Found ${pendingJobs.length} total jobs to process.`);
  return pendingJobs;
}

async function enrichJobData(jobContent: string): Promise<any | null> {
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
        const aiProvider = getAiProvider();
        const aiResponseText = await aiProvider.generateContent(prompt);
        
        const cleanedJsonString = aiResponseText.replace(/^\\`\\`\\`json\\n|\\`\\`\\`$/g, '').trim();
        return JSON.parse(cleanedJsonString);

    } catch (error: any) {
        console.error("Error during AI enrichment:", error.message);
        return null;
    }
}

function summarizeChanges(oldFrontmatter: any, newFrontmatter: any, oldBody: string, newBody: string): string {
    const changes: string[] = [];
    for (const key in newFrontmatter) {
        if (oldFrontmatter[key] !== newFrontmatter[key]) {
            if (oldFrontmatter[key] === null || oldFrontmatter[key] === undefined || oldFrontmatter[key] === '') {
                changes.push(`- ✨ Enriched "${key}"`);
            } else {
                changes.push(`- ✏️ Updated "${key}"`);
            }
        }
    }
    if (oldBody.trim() !== newBody.trim()) {
        changes.push("- 🔄 Body content was rewritten and formatted by the AI.");
    }
    if (changes.length === 0) return "No significant changes were made.";
    if (changes.length > 1) {
        const statusChangeIndex = changes.findIndex(c => c.includes("Updated \"status\""));
        if (statusChangeIndex > -1) changes.splice(statusChangeIndex, 1);
    }
    return "\n📊 Summary of Changes:\n" + changes.join("\n");
}

async function enrichJobs(isDryRun = false) {
    if (isDryRun) {
        console.log('--- DRY RUN MODE: No files will be written. ---');
    }

    let totalProcessed = 0;
    const jobsToProcess = await getPendingJobs(5);

    if (jobsToProcess.length === 0) {
        console.log('No pending jobs found to process.');
        return;
    }

    for (const job of jobsToProcess) {
        try {
            console.log(`\nProcessing file: ${path.basename(job.filePath)}`);
            const enrichedData = await enrichJobData(job.content);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping file ${path.basename(job.filePath)} due to incomplete AI response.`);
                continue;
            }

            const newFrontmatter = { ...job.frontmatter };
            for (const key in enrichedData.frontmatterFields) {
                const value = enrichedData.frontmatterFields[key];
                if (Object.prototype.hasOwnProperty.call(enrichedData.frontmatterFields, key) && value !== null && value !== undefined) {
                    if (newFrontmatter[key] === null || newFrontmatter[key] === undefined || newFrontmatter[key] === '') {
                        newFrontmatter[key] = value;
                    }
                }
            }
            newFrontmatter.status = 'pending_approval';

            const newBody = enrichedData.markdownBody;
            const newFileContent = matter.stringify(newBody, newFrontmatter);
            const summary = summarizeChanges(job.frontmatter, newFrontmatter, job.content, newBody);
            console.log(summary);

            if (isDryRun) {
              console.log(`\n--- DRY RUN: Changes for ${path.basename(job.filePath)} ---`);
              console.log(newFileContent);
              console.log(`--- END DRY RUN: ${path.basename(job.filePath)} ---
`);
            } else {
              await fs.writeFile(job.filePath, newFileContent, 'utf8');
              console.log(`Successfully enriched and updated ${path.basename(job.filePath)}`);
            }
            totalProcessed++;
            
        } catch (error) {
            console.error(`Failed to process file ${path.basename(job.filePath)}. Error:`, error);
        }
    }
    console.log(`\nEnrichment script finished. ${isDryRun ? '(DRY RUN)' : ''} Processed a total of ${totalProcessed} jobs.`);
}

// --- EXECUTION BLOCK ---
if (require.main === module) {
    const isStandaloneDryRun = process.argv.includes('--dry-run');
    enrichJobs(isStandaloneDryRun)
      .then(() => {
        console.log('\nJob enrichment process completed successfully.\n');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\nJob enrichment process failed.\n', error);
        process.exit(1);
      });
}

module.exports = { enrichJobs };