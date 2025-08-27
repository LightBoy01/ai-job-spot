import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const articlesDir = path.join(process.cwd(), 'src', 'articles');

async function reindexArticles() {
  try {
    const files = await fs.readdir(articlesDir);
    const markdownFiles = files.filter(file => path.extname(file) === '.md').sort();

    console.log(`Found ${markdownFiles.length} articles to re-index.`);

    for (let i = 0; i < markdownFiles.length; i++) {
      const file = markdownFiles[i];
      const filePath = path.join(articlesDir, file);
      const newIssueNo = i + 1;

      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      if (data.issueNo === newIssueNo) {
        console.log(`[SKIPPING] ${file} already has the correct issueNo (${newIssueNo}).`);
        continue;
      }

      data.issueNo = newIssueNo;

      const newContent = matter.stringify(content, data);
      await fs.writeFile(filePath, newContent, 'utf8');

      console.log(`[UPDATED] ${file} -> issueNo: ${newIssueNo}`);
    }

    console.log('\nRe-indexing complete. All articles now have unique, sequential issue numbers.');

  } catch (error) {
    console.error('An error occurred during the re-indexing process:', error);
  }
}

reindexArticles();
