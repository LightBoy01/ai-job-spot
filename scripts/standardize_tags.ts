import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve(process.cwd(), 'src', 'articles');
const isDryRun = process.argv.includes('--dry-run');

async function standardizeTags() {
    console.log(isDryRun ? '--- Standardizing Tags (Dry Run) ---' : '--- Standardizing Tags ---');
    const files = await fs.readdir(ARTICLES_DIR);
    let updatedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(ARTICLES_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        if (data.tags !== undefined) {
            skippedCount++;
            continue; // Skip if the tags field already exists, even if empty
        }

        console.log(`[${isDryRun ? 'DRY RUN' : 'UPDATE'}] Adding 'tags: []' to ${file}`);
        data.tags = [];
        updatedCount++;

        if (!isDryRun) {
            const newFileContent = matter.stringify(content, data);
            await fs.writeFile(filePath, newFileContent, 'utf8');
        }
    }

    console.log(`
--- Tag Standardization Complete ---`);
    console.log(`Updated: ${updatedCount} files`);
    console.log(`Skipped: ${skippedCount} files (already had a tags field)`);
    if (isDryRun) {
        console.log('No files were actually changed.');
    }
}

standardizeTags().catch(console.error);
