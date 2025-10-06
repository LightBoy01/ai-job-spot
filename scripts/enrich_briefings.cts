const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { getAiProvider } = require('../src/lib/ai/client.cts');

const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');

interface PendingBriefing {
  filePath: string;
  frontmatter: { [key: string]: any };
  content: string;
}

async function getPendingBriefings(): Promise<PendingBriefing[]> {
  console.log(`Scanning for briefings with status 'pending_review'...`);
  const pendingBriefings: PendingBriefing[] = [];
  try {
    const files = await fs.readdir(BRIEFINGS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);

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
    // If the directory doesn't exist, it's not an error, just means no briefings to process.
  }
  
  console.log(`Found ${pendingBriefings.length} total briefings to process.`);
  return pendingBriefings;
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
        const aiProvider = getAiProvider();
        console.log('Enriching briefing content...');
        const aiResponseText = await aiProvider.generateContent(prompt);
        
        const cleanedJsonString = aiResponseText.replace(/^\\`\\`\\`json\\n|\\`\\`\\`$/g, '').trim();
        return JSON.parse(cleanedJsonString);

    } catch (error: any) {
        console.error("Error during AI enrichment:", error.message);
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
              console.log(`--- END DRY RUN: ${path.basename(briefing.filePath)} ---
`);
            } else {
              await fs.writeFile(briefing.filePath, newFileContent, 'utf8');
              console.log(`Successfully enriched and updated ${path.basename(briefing.filePath)}`);
            }
            totalProcessed++;
            
        } catch (error) {
            console.error(`Failed to process file ${path.basename(briefing.filePath)}. Error:`, error);
        }
    }
    console.log(`\nEnrichment script for briefings finished. ${isDryRun ? '(DRY RUN)' : ''} Processed a total of ${totalProcessed} briefings.`);
}

// --- EXECUTION BLOCK ---
if (require.main === module) {
    const isStandaloneDryRun = process.argv.includes('--dry-run');
    enrichBriefings(isStandaloneDryRun)
      .then(() => {
        console.log('\nBriefing enrichment process completed successfully.\n');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\nBriefing enrichment process failed.\n', error);
        process.exit(1);
      });
}

module.exports = { enrichBriefings };
