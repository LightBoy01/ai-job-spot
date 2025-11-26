import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';

const JOB_DESCRIPTIONS_DIR = path.resolve(process.cwd(), 'src', 'job-descriptions');

function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()"'!:@]/g,
  });
}

async function renameJobFiles() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(isDryRun ? '--- DRY RUN MODE ---' : '--- LIVE RENAME MODE ---');
  console.log(`Scanning directory: ${JOB_DESCRIPTIONS_DIR}\n`);

  let processedCount = 0;
  let renamedCount = 0;
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const files = await fs.readdir(JOB_DESCRIPTIONS_DIR);

    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }

      const filePath = path.join(JOB_DESCRIPTIONS_DIR, file);
      processedCount++;

      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data } = matter(fileContent);

        const { id, company, title } = data;

        if (!id || !company || !title) {
          warnings.push(`Skipping ${file}: Missing required frontmatter (id, company, or title).`);
          continue;
        }

        const companySlug = createSlug(company);
        const titleSlug = createSlug(title);
        const newFilename = `${id}-${companySlug}-${titleSlug}.md`;

        if (file === newFilename) {
          continue; // Already named correctly
        }

        console.log(`${file} -> ${newFilename}`);
        renamedCount++;

        if (!isDryRun) {
          const newFilePath = path.join(JOB_DESCRIPTIONS_DIR, newFilename);
          await fs.rename(filePath, newFilePath);
        }
      } catch (error: unknown) {
        errors.push(`Failed to process ${file}: ${(error as Error).message}`);
      }
    }

    console.log('\n--- RENAME SUMMARY ---');
    console.log(`Total files scanned: ${processedCount}`);
    console.log(`Files to be renamed: ${renamedCount}`);
    if (isDryRun) {
      console.log('No files were actually renamed (dry run).');
    } else {
      console.log('Files successfully renamed.');
    }

    if (warnings.length > 0) {
      console.log('\nWarnings:');
      warnings.forEach(w => console.log(`- ${w}`));
    }

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(e => console.log(`- ${e}`));
    }

  } catch (error: unknown) {
    console.error(`\nFATAL: Could not read directory ${JOB_DESCRIPTIONS_DIR}`, (error as Error).message);
    process.exit(1);
  }
}

renameJobFiles().catch((err: unknown) => {
  console.error('An unexpected error occurred:', (err as Error).message);
  process.exit(1);
});
