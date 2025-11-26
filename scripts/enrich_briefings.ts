import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

import dotenv from 'dotenv';

import { z } from 'zod';

dotenv.config({ path: '.env.local' });

const EnrichedBriefingDataSchema = z.object({
  frontmatterFields: z.object({
    suggestedTitle: z.string(),
    suggestedTags: z.string(),
  }),
  markdownBody: z.string(),
});

type EnrichedBriefingData = z.infer<typeof EnrichedBriefingDataSchema>;

import { callGeminiApi } from '../src/data-pipeline/utils/ai.js';
import { sanitizeAndParseJson } from './utils/ai-response-parser.js';

const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');

interface PendingBriefing {
  filePath: string;
  frontmatter: { [key: string]: unknown };
  content: string;
}

// ... (rest of the imports)

async function getPendingBriefings(): Promise<PendingBriefing[]> {
  console.log("Scanning for briefings with status 'pending_review'...");
  const pendingBriefings: PendingBriefing[] = [];
  try {
    const files = await fs.readdir(BRIEFINGS_DIR);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const rawFileContent = await fs.readFile(filePath, 'utf8');
        // Clean the content by removing the auto-generated warning comment
        const cleanedFileContent = rawFileContent.replace(/<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->\s*/, '');
        const { data, content } = matter(cleanedFileContent);

        if (data.status === 'pending_review') {
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
  
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  let limit = 25; // Default limit

  if (limitArg) {
      const limitValue = parseInt(limitArg.split('=')[1], 10);
      if (!isNaN(limitValue) && limitValue > 0) {
          limit = Math.min(limitValue, 100); // Enforce max limit of 100
      }
  }
  
  console.log(`Found ${pendingBriefings.length} total pending briefings.`);
  const briefingsToProcess = pendingBriefings.slice(0, limit);

  if (pendingBriefings.length > limit) {
    console.log(`This run will be limited to processing ${limit} briefings.`);
  }
  return briefingsToProcess;
}

export async function enrichBriefingData(briefingContent: string, originalTitle: string): Promise<EnrichedBriefingData | null> {
    console.log("Sending content to AI for enrichment...");

    if (!process.env.AI_API_KEY) {
        console.warn("AI_API_KEY environment variable not set. Using simulated AI response.");
        // SIMULATED AI RESPONSE
        return {
            frontmatterFields: {
                suggestedTitle: "This is a simulated title",
                suggestedTags: "AI, Simulation, Testing",
            },
            markdownBody: `### Summary\nThis is a simulated summary.\n\n### Why It Matters\nThis is a simulated analysis of why it matters.`
        };
    }

    const prompt = `
      Analyze the following article content, which is a briefing on a topic in the AI industry. Your task is to analyze it and provide insightful, original commentary.
      Return ONLY a single, valid JSON object with two top-level keys: "frontmatterFields" and "markdownBody".

      1.  **frontmatterFields**: An object containing these exact keys:
          - "suggestedTitle": Create a new, highly engaging and SEO-friendly title for this briefing. The original title was: "${originalTitle}".
          - "suggestedTags": Suggest 3 to 5 relevant, specific tags as a single, comma-separated string (e.g., "AI Ethics, Large Language Models, Policy").

      2.  **markdownBody**: A single string containing a rewritten, more valuable version of the briefing in well-formatted Markdown. It MUST include the following sections using '###' headers:
          - ### Summary: A concise, one-paragraph summary of the key information in the original content.
          - ### Why It Matters: A new, original analysis section. Explain the broader implications of this news. Why does it matter to a professional in the AI space? What's the bigger picture or the underlying trend? Provide a strong, insightful take.

      IMPORTANT: The entire output MUST be a single, valid JSON object. The markdownBody value must be a single-line string with all special characters properly escaped.

      EXAMPLE of a valid markdownBody value:
      "markdownBody": "### Summary\\nThis is a summary.\\n\\n### Why It Matters\\nThis matters because of \\"reasons\\". It's important."

      Pay close attention to escaping all double quotes (") with (\\") and all newline characters with (\\n) within the markdownBody string value.

      Do not add any fields that are not requested.

      ARTICLE CONTENT TO ANALYZE:
      ${briefingContent}

      JSON OUTPUT:
    `;

    const aiResponseText = await callGeminiApi(prompt);

    if (!aiResponseText) {
        return null;
    }
    
    return sanitizeAndParseJson(aiResponseText, EnrichedBriefingDataSchema);
}

export async function enrichBriefings(isDryRun = false) {
    console.log('\n--- [START] Briefing Enrichment Script ---');
    if (isDryRun) {
        console.log('--- DRY RUN MODE: No files will be written. ---\n');
    }

    const briefingsToProcess = await getPendingBriefings();
    const summary = {
        totalFound: briefingsToProcess.length,
        successfullyProcessed: 0,
        skipped: 0,
        failed: 0,
    };

    if (summary.totalFound === 0) {
        console.log('No pending briefings found to process.');
        console.log('--- [END] Briefing Enrichment Script ---');
        return;
    }

    for (const briefing of briefingsToProcess) {
        const briefingIndex = briefingsToProcess.indexOf(briefing) + 1;
        const fileName = path.basename(briefing.filePath);
        console.log(`\n--- [${briefingIndex}/${summary.totalFound}] Processing: ${fileName} ---`);

        try {
            const enrichedData = await enrichBriefingData(briefing.content, briefing.frontmatter.title as string);

            if (!enrichedData || !enrichedData.markdownBody || !enrichedData.frontmatterFields) {
                console.log(`Skipping file ${fileName} due to incomplete AI response.`);
                summary.skipped++;
                continue;
            }

            const newFrontmatter = { ...briefing.frontmatter };
            newFrontmatter.title = enrichedData.frontmatterFields.suggestedTitle || newFrontmatter.title as string;
            const existingTags = new Set(((newFrontmatter.tags as string[]) || []).map((t: string) => t.trim()));
            const suggestedTags = (enrichedData.frontmatterFields.suggestedTags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
            suggestedTags.forEach((tag: string) => existingTags.add(tag));
            newFrontmatter.tags = Array.from(existingTags);
            newFrontmatter.status = 'pending_approval';

            const newBody = enrichedData.markdownBody;
            const newFileContent = matter.stringify(newBody, newFrontmatter);

            console.log(`\n📊 Summary of Changes for ${fileName}:`);
            console.log(`- Title updated to: "${newFrontmatter.title}"`);
            console.log(`- Tags updated to: ${(newFrontmatter.tags as string[]).join(', ')}`);
            console.log("- Body content was rewritten with 'Summary' and 'Why It Matters' sections.");

            if (isDryRun) {
              console.log(`\n--- DRY RUN: Changes for ${fileName} ---`);
              console.log(newFileContent);
              console.log(`--- END DRY RUN: ${fileName} ---\n`);
            } else {
              await fs.writeFile(briefing.filePath, newFileContent, 'utf8');
              console.log(`✅ Successfully enriched and updated ${fileName}`);
            }
            summary.successfullyProcessed++;

            if (briefingsToProcess.indexOf(briefing) < briefingsToProcess.length - 1) {
                console.log('Waiting for 15 seconds before the next briefing...');
                await new Promise(resolve => setTimeout(resolve, 15000));
            }
            
        } catch (error) {
            console.error(`❌ Failed to process file ${fileName}. Error:`, error);
            summary.failed++;
        }
    }

    console.log('\n--- [END] Briefing Enrichment Script ---');
    console.log('--- Final Summary ---');
    console.log(`Total Briefings Found: ${summary.totalFound}`);
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
        const isDryRun = process.argv.includes('--dry-run');
        await enrichBriefings(isDryRun);
    }
}

main().catch(error => {
    console.error("An unexpected error occurred during briefing enrichment:", error);
    process.exit(1);
});
