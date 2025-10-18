import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// --- Configuration ---
const CONFIG = {
  jobs: {
    dir: path.resolve(process.cwd(), 'src', 'job-descriptions'),
  },
  briefings: {
    dir: path.resolve(process.cwd(), 'src', 'content', 'briefings'),
  },
};

type ContentType = keyof typeof CONFIG;

/**
 * This script finds content with a 'pending_approval' status in its frontmatter
 * and updates it to 'published'.
 */
async function publishApprovedContent(contentType: ContentType) {
  const config = CONFIG[contentType];
  if (!config) {
    console.error(`Invalid content type specified: ${contentType}. Use 'jobs' or 'briefings'.`);
    process.exit(1);
  }

  const isDryRun = process.argv.includes('--dry-run');
  console.log(isDryRun ? `Starting ${contentType} publishing process in --dry-run mode...` : `Starting ${contentType} publishing process...`);
  
  let publishedCount = 0;
  const warnings: string[] = [];
  const filesToPublish: string[] = [];

  try {
    const files = await fs.readdir(config.dir);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(config.dir, file);
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            if (data.status === 'pending_approval') {
                filesToPublish.push(file);
                if (!isDryRun) {
                    data.status = 'published';
                    const newFileContent = matter.stringify(content, data);
                    await fs.writeFile(filePath, newFileContent, 'utf8');
                }
                publishedCount++;
            }
        } catch (error: any) {
            warnings.push(`Failed to process file ${file}: ${error.message}`);
        }
    }

    if (isDryRun) {
        console.log(`
--- Dry Run Report for ${contentType} ---`);
        if (filesToPublish.length > 0) {
            console.log(`Found ${filesToPublish.length} ${contentType} to publish:`);
            filesToPublish.forEach(f => console.log(`- ${f}`));
        } else {
            console.log(`No ${contentType} with status 'pending_approval' found.`);
        }
        console.log('No files were changed.');
    } else {
        console.log(`
--- Publish Report for ${contentType} ---`);
        if (filesToPublish.length > 0) {
            console.log(`Successfully published ${filesToPublish.length} ${contentType}:`);
            filesToPublish.forEach(f => console.log(`- ${f}`));
        } else {
            console.log(`No ${contentType} with status 'pending_approval' were found to publish.`);
        }
    }

    if (warnings.length > 0) {
        console.log('
Encountered warnings:');
        warnings.forEach(w => console.log(`- ${w}`));
    }

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.error(`Error: Directory not found for ${contentType}: ${config.dir}`);
    } else {
        console.error(`Error during ${contentType} publishing process:`, error.message);
    }
    process.exit(1);
  }
}

// --- Main Execution ---
async function main() {
    const contentType = process.argv[2] as ContentType;
    if (!contentType || !CONFIG[contentType]) {
        console.error("Please specify a valid content type: 'jobs' or 'briefings'.");
        console.error("Usage: ts-node scripts/publish_content.ts <jobs|briefings> [--dry-run]");
        process.exit(1);
    }

    try {
        await publishApprovedContent(contentType);
        console.log(`
${contentType} publishing process completed successfully.
`);
        process.exit(0);
    } catch (error) {
        console.error(`
${contentType} publishing process failed.
`, error);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}