import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve(process.cwd(), 'src', 'articles');

/**
 * Iterates through all markdown files in the articles directory and adds
 * `contentType: 'editorial'` to the frontmatter if it doesn't already exist.
 * The script is idempotent and safe to run multiple times.
 */
async function backfillContentType() {
  console.log(`Starting backfill process for directory: ${ARTICLES_DIR}`);
  let filesProcessed = 0;
  let filesModified = 0;

  try {
    const files = await fs.readdir(ARTICLES_DIR);

    for (const file of files) {
      if (path.extname(file) !== '.md') continue;

      filesProcessed++;
      const filePath = path.join(ARTICLES_DIR, file);

      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        // Idempotency check: only modify the file if contentType is missing.
        if (data.contentType) {
          console.log(`- Skipping ${file}: contentType already exists ('${data.contentType}').`);
          continue;
        }

        console.log(`+ Modifying ${file}: adding contentType: 'editorial'.`);
        const newData = { ...data, contentType: 'editorial' };
        const newFileContent = matter.stringify(content, newData);

        await fs.writeFile(filePath, newFileContent, 'utf-8');
        filesModified++;

      } catch (error) {
        console.error(`! Error processing file ${file}:`, error);
      }
    }

    console.log('\nBackfill process complete.');
    console.log(`- Files Scanned: ${filesProcessed}`);
    console.log(`- Files Modified: ${filesModified}`);

  } catch (error) {
    console.error('Failed to read articles directory:', error);
    process.exit(1);
  }
}

backfillContentType().catch(error => {
  console.error('A critical error occurred during the backfill process:', error);
  process.exit(1);
});
