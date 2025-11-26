import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function cleanupBriefings() {
  const briefingsDir = path.join(process.cwd(), 'src', 'content', 'briefings');
  let deletedCount = 0;

  console.log('--- Briefing Cleanup Script ---');

  try {
    const files = await fs.readdir(briefingsDir);
    console.log(`Found ${files.length} files to check in src/content/briefings/\n`);

    for (const file of files) {
      if (path.extname(file) !== '.md') continue;

      const filePath = path.join(briefingsDir, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data } = matter(fileContent);

      if (data.status !== 'published') {
        await fs.unlink(filePath);
        console.log(`[DELETED] ${file} (status: '${data.status || 'undefined'}')`);
        deletedCount++;
      }
    }

    console.log(`\nCleanup complete. Deleted ${deletedCount} non-published briefing(s).`);

  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Directory src/content/briefings not found. Nothing to clean up.');
    } else {
      console.error('\nError during briefing cleanup:', error);
      process.exit(1);
    }
  }
}

cleanupBriefings();
