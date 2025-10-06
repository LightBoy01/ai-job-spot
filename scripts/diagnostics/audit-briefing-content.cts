const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');

async function checkBriefingsContent() {
  console.log(`Checking briefing articles in ${BRIEFINGS_DIR} for empty content...`);
  let emptyContentCount = 0;
  let totalBriefings = 0;
  const emptyContentFiles: string[] = [];

  try {
    const files = await fs.readdir(BRIEFINGS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      totalBriefings++;
      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { content } = matter(fileContent);

        if (!content || content.trim() === '') {
          emptyContentCount++;
          emptyContentFiles.push(file);
        }
      } catch (readError) {
        console.error(`Error reading file ${file}:`, readError);
      }
    }
  } catch (error) {
    console.error('Error reading briefings directory:', error);
    process.exit(1);
  }

  console.log(`
--- Briefing Content Report ---`);
  console.log(`Total briefing articles: ${totalBriefings}`);
  console.log(`Articles with empty content: ${emptyContentCount}`);

  if (emptyContentCount > 0) {
    console.log(`
Files with empty content:`);
    emptyContentFiles.forEach(file => console.log(`- ${file}`));
  } else {
    console.log(`All briefing articles contain content.`);
  }
}

checkBriefingsContent().catch(error => {
  console.error('A critical error occurred during content check:', error);
  process.exit(1);
});
