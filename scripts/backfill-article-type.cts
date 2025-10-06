const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

const ARTICLES_DIR = path.resolve(process.cwd(), 'src', 'articles');

async function backfillArticleContentType() {
  console.log('--- Starting Backfill Script for Article Content Type ---');
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    const files = await fs.readdir(ARTICLES_DIR);

    for (const file of files) {
      if (path.extname(file) !== '.md') {
        continue;
      }

      const filePath = path.join(ARTICLES_DIR, file);

      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        if (data.contentType) {
          console.log(`[SKIPPED] ${file} already has a contentType.`);
          skippedCount++;
          continue;
        }

        // Add the new field
        data.contentType = 'editorial';

        const newFileContent = matter.stringify(content, data);
        await fs.writeFile(filePath, newFileContent, 'utf-8');
        console.log(`[UPDATED] ${file} with contentType: 'editorial'.`);
        updatedCount++;

      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    console.log('\n--- Backfill Complete ---');
    console.log(`Files Updated: ${updatedCount}`);
    console.log(`Files Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('Failed to read articles directory:', error);
    process.exit(1);
  }
}

backfillArticleContentType().catch(err => {
  console.error('A critical error occurred during the backfill process:', err);
  process.exit(1);
});
