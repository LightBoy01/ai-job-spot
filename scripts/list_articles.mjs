
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function listArticles() {
  const articlesDir = path.join(process.cwd(), 'src', 'articles');
  const files = await fs.readdir(articlesDir);
  const articles = [];

  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(articlesDir, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data } = matter(fileContent);
      articles.push({
        slug: data.slug,
        title: data.title,
        volumeNo: data.volumeNo,
        issueNo: data.issueNo,
      });
    }
  }

  // Sort by volume and then by issue number
  articles.sort((a, b) => {
    if (a.volumeNo !== b.volumeNo) {
      return (a.volumeNo || 0) - (b.volumeNo || 0);
    }
    return (a.issueNo || 0) - (b.issueNo || 0);
  });

  console.log('| Slug                                             | Volume | Issue |');
  console.log('|--------------------------------------------------|--------|-------|');
  for (const article of articles) {
    const slug = (article.slug || '').padEnd(48);
    const volume = (article.volumeNo || 'N/A').toString().padEnd(6);
    const issue = (article.issueNo || 'N/A').toString().padEnd(5);
    console.log(`| ${slug} | ${volume} | ${issue} |`);
  }
}

listArticles().catch(console.error);
