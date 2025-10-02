import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve(process.cwd(), 'src', 'articles');
const isDryRun = process.argv.includes('--dry-run');

// Define the categorization logic based on keywords in the title
const hubConfig = [
    { name: 'Mental Models & Frameworks', keywords: ['Protocol', 'Framework', 'Lever', 'Mirror', 'Loop', 'Filter', 'Compass'] },
    { name: 'Career & Professional Strategy', keywords: ['Career', 'Cartography', 'Gravity', 'Advantage', 'Polymath'] },
    { name: 'The Human Advantage', keywords: ['Deep Work', 'Unlearning', 'Humility', 'Resilience', 'Soft Skills', 'Connection', 'Trust', 'Silence', 'Creativity', 'Artist'] },
    { name: 'AI & The World', keywords: ['in Cybersecurity', 'in Education', 'in Finance', 'in Healthcare', 'Logistics', 'Generative AI', 'Job Industry'] }
];

function getHubForArticle(title: string): string | null {
    const lowerTitle = title.toLowerCase();
    // Handle specific edge cases first
    if (lowerTitle.includes('unseen foundations')) return 'AI & The World';

    for (const hub of hubConfig) {
        for (const keyword of hub.keywords) {
            if (lowerTitle.includes(keyword.toLowerCase())) {
                return hub.name;
            }
        }
    }
    return null; // Default if no match
}

async function categorizeArticles() {
    console.log(isDryRun ? '--- Starting Hub Categorization (Dry Run) ---' : '--- Starting Hub Categorization ---');
    const files = await fs.readdir(ARTICLES_DIR);
    let updatedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(ARTICLES_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        if (data.hub) {
            skippedCount++;
            continue;
        }

        const hub = getHubForArticle(data.title || '');
        if (hub) {
            console.log(`[${isDryRun ? 'DRY RUN' : 'UPDATE'}] ${file} -> Hub: ${hub}`);
            data.hub = hub;
            if (!isDryRun) {
                const newFileContent = matter.stringify(content, data);
                await fs.writeFile(filePath, newFileContent, 'utf8');
            }
            updatedCount++;
        } else {
            console.log(`[SKIP] No hub category found for: ${file}`);
            skippedCount++;
        }
    }

    console.log(`
--- Categorization Complete ---`);
    console.log(`Updated: ${updatedCount} files`);
    console.log(`Skipped: ${skippedCount} files (already had a hub or no match found)`);
    if (isDryRun) {
        console.log('No files were actually changed.');
    }
}

categorizeArticles().catch(console.error);
