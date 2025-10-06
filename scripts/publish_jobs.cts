const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

const JOB_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');

/**
 * This script finds job postings with a 'pending_approval' status in their frontmatter
 * and updates them to 'published'.
 */
async function publishApprovedJobs() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(isDryRun ? 'Starting job publishing process in --dry-run mode...' : 'Starting job publishing process...');
  
  let publishedCount = 0;
  const warnings: string[] = [];
  const filesToPublish: string[] = [];

  try {
    const files = await fs.readdir(JOB_DIR);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(JOB_DIR, file);
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
        console.log('\n--- Dry Run Report ---');
        if (filesToPublish.length > 0) {
            console.log(`Found ${filesToPublish.length} jobs to publish:`);
            filesToPublish.forEach(f => console.log(`- ${f}`));
        } else {
            console.log("No jobs with status 'pending_approval' found.");
        }
        console.log('No files were changed.');
    } else {
        console.log('\n--- Publish Report ---');
        if (filesToPublish.length > 0) {
            console.log(`Successfully published ${filesToPublish.length} jobs:`);
            filesToPublish.forEach(f => console.log(`- ${f}`));
        } else {
            console.log('No jobs with status \'pending_approval\' were found to publish.');
        }
    }

    if (warnings.length > 0) {
        console.log('\nEncountered warnings:');
        warnings.forEach(w => console.log(`- ${w}`));
    }

  } catch (error: any) {
    console.error('Error during job publishing process:', error.message);
    process.exit(1);
  }
}

// Execute the function if the script is run directly
if (process.env.NODE_ENV !== 'test') {
  publishApprovedJobs()
    .then(() => {
      console.log('\nJob publishing process completed successfully.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nJob publishing process failed.\n', error);
      process.exit(1);
    });
}