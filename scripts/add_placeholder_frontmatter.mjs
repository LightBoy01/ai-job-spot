import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = 'src/articles';
const NEW_ARTICLES = [
  {
    filename: 'the-future-of-ai-in-healthcare.md',
    slug: 'the-future-of-ai-in-healthcare',
    title: 'The Future of AI in Healthcare',
    tags: ['AI', 'Healthcare', 'Future'],
  },
  {
    filename: 'the-empty-cup-intellectual-humility.md',
    slug: 'the-empty-cup-intellectual-humility',
    title: 'The Empty Cup: Cultivating Intellectual Humility',
    tags: ['Intellectual Humility', 'Mindset', 'Learning'],
  },
  {
    filename: 'the-art-of-strategic-unlearning.md',
    slug: 'the-art-of-strategic-unlearning',
    title: 'The Art of Strategic Unlearning',
    tags: ['Unlearning', 'Strategy', 'Adaptability'],
  },
];

const addFrontmatter = (article) => {
  const publishDate = new Date().toISOString();
  const frontmatter =
    `---\n` +
    `slug: "${article.slug}"
` +
    `title: "${article.title}"
` +
    `author: "AI Job Spot Team"
` +
    `publishDate: "${publishDate}"
` +
    `issueNo: 999
` +
    `volumeNo: 999
` +
    `markdownFile: "${article.filename}"
` +
    `tags: [${article.tags.map((tag) => `"${tag}"`).join(', ')}]
` +
    `imageUrl: null
` +
    `---\n\n`;

  const filePath = path.join(ARTICLES_DIR, article.filename);
  if (fs.existsSync(filePath)) {
    const mdContent = fs.readFileSync(filePath, 'utf8');
    if (!mdContent.trim().startsWith('---')) {
      fs.writeFileSync(filePath, frontmatter + mdContent, 'utf8');
      console.log(`Added frontmatter to: ${article.filename}`);
    } else {
      console.log(`Frontmatter already exists for: ${article.filename}`);
    }
  } else {
    console.log(`Warning: File not found: ${article.filename}`);
  }
};

NEW_ARTICLES.forEach(addFrontmatter);
