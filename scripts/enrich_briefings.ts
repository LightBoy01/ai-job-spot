import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { gotScraping } from 'got-scraping';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.AI_API_KEY}`;

interface PendingBriefing {
  filePath: string;
  frontmatter: { [key: string]: any };
  content: string;
}

import { globSync } from 'glob';

// ... (rest of the imports)

async function getPendingBriefings(): Promise<PendingBriefing[]> {
  console.log(`Scanning for up to 25 briefings with status 'pending_review'...`);
  const pendingBriefings: PendingBriefing[] = [];
  try {
    const files = globSync('**/*.md', { cwd: BRIEFINGS_DIR, ignore: 'archive/**' });

    for (const file of files) {
      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        // Use a resilient check against the raw file content to bypass frontmatter parsing issues.
        if (fileContent.includes('status: pending_review')) {
          const { data, content } = matter(fileContent);
          pendingBriefings.push({ filePath, frontmatter: data, content });
        }
      } catch (error) {
        console.warn(`Could not process file ${file}. Skipping.`, error);
      }
    }
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error reading briefings directory: ${BRIEFINGS_DIR}`, error);
    }
  }
  
  console.log(`Found ${pendingBriefings.length} total pending briefings.`);
  const briefingsToProcess = pendingBriefings.slice(0, 25);
  if (pendingBriefings.length > 25) {
    console.log(`Limiting this run to 25 briefings.`);
  }
  return briefingsToProcess;
}

async function enrichBriefingData(briefingContent: string, originalTitle: string): Promise<any | null> {
    const prompt = `
      Analyze the following article content, which is a briefing on a topic in the AI industry. Your task is to analyze it and provide insightful, original commentary.
      Return ONLY a single, valid JSON object with two top-level keys: "frontmatterFields" and "markdownBody".

      1.  **frontmatterFields**: An object containing these exact keys:
          - "suggestedTitle": Create a new, highly engaging and SEO-friendly title for this briefing. The original title was: "${originalTitle}".
          - "suggestedTags": Suggest 3 to 5 relevant, specific tags as a single, comma-separated string (e.g., "AI Ethics, Large Language Models, Policy").

      2.  **markdownBody**: A single string containing a rewritten, more valuable version of the briefing in well-formatted Markdown. It MUST include the following sections using '###' headers:
          - ### Summary: A concise, one-paragraph summary of the key information in the original content.
          - ### Why It Matters: A new, original analysis section. Explain the broader implications of this news. Why does it matter to a professional in the AI space? What's the bigger picture or the underlying trend? Provide a strong, insightful take.

      Do not add any fields that are not requested. The entire output must be a single JSON object.

      ARTICLE CONTENT TO ANALYZE:
      """
      ${briefingContent}
      """

      JSON OUTPUT:
    `;

    try {
        console.log('Enriching briefing content...');
        const response = await gotScraping.post({
            url: GEMINI_API_URL,
            json: {
                contents: [{ parts: [{ text: prompt }] }],
            },
            responseType: 'json'
        });

        const aiResponseText = response.body?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseText) {
            console.error("Error: AI response was malformed or empty.", response.body);
            return null;
        }
        
        const cleanedJsonString = aiResponseText.replace(/^```json\n|```$/g, '').trim();
        return JSON.parse(cleanedJsonString);

    } catch (error: any) {
        console.error("Error during AI enrichment:", error.response ? error.response.body : error.message);
        return null;
    }
}

async function enrichBriefings(isDryRun = false) {
    if (isDryRun) {
        console.log('--- DRY RUN MODE: No files will be written. ---');
    }

    let totalProcessed = 0;
    const briefingsToProcess = await getPendingBriefings();

    if (briefingsToProcess.length === 0) {
        console.log('No pending briefings found to process.');
        return;
    }

    for (const briefing of briefingsToProcess) {
        try {
            console.log(`\nProcessing file: ${path.basename(briefing.filePath)}`);
            const enrichedData = await enrichBriefingData(briefing.content, briefing.frontmatter.title);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping file ${path.basename(briefing.filePath)} due to incomplete AI response.`);
                continue;
            }

            const newFrontmatter = { ...briefing.frontmatter };
            newFrontmatter.title = enrichedData.frontmatterFields.suggestedTitle || newFrontmatter.title;
            const existingTags = new Set((newFrontmatter.tags || []).map((t: string) => t.trim()));
            const suggestedTags = (enrichedData.frontmatterFields.suggestedTags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
            suggestedTags.forEach((tag: string) => existingTags.add(tag));
            newFrontmatter.tags = Array.from(existingTags);
            newFrontmatter.status = 'pending_approval';

            const newBody = enrichedData.markdownBody;
            const newFileContent = matter.stringify(newBody, newFrontmatter);

            console.log(`\n📊 Summary of Changes for ${path.basename(briefing.filePath)}:`);
            console.log(`- Title updated to: "${newFrontmatter.title}"`);
            console.log(`- Tags updated to: ${newFrontmatter.tags.join(', ')}`);
            console.log("- Body content was rewritten with 'Summary' and 'Why It Matters' sections.");

            if (isDryRun) {
              console.log(`\n--- DRY RUN: Changes for ${path.basename(briefing.filePath)} ---`);
              console.log(newFileContent);
              console.log(`--- END DRY RUN: ${path.basename(briefing.filePath)} ---\n`);
            } else {
              await fs.writeFile(briefing.filePath, newFileContent, 'utf8');
              console.log(`Successfully enriched and updated ${path.basename(briefing.filePath)}`);
            }
            totalProcessed++;

            // Add a 7-second delay between requests to avoid rate limiting
            if (briefingsToProcess.indexOf(briefing) < briefingsToProcess.length - 1) {
                console.log('Waiting for 7 seconds before the next briefing...');
                await new Promise(resolve => setTimeout(resolve, 7000));
            }
            
        } catch (error) {
            console.error(`Failed to process file ${path.basename(briefing.filePath)}. Error:`, error);
        }
    }
    console.log(`\nEnrichment script for briefings finished. ${isDryRun ? '(DRY RUN)' : ''} Processed a total of ${totalProcessed} briefings.`);
}

// --- EXECUTION BLOCK ---
const isDryRun = process.argv.includes('--dry-run');
enrichBriefings(isDryRun)
  .then(() => {
    console.log('\nBriefing enrichment process completed successfully.\n');
  })
  .catch((error) => {
    console.error('\nBriefing enrichment process failed.\n', error);
  });