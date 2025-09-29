import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = path.resolve('src/articles');
const JOBS_DIR = path.resolve('src/job-descriptions');

function removeFrontmatterFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');

  let inFrontmatter = false;
  let frontmatterRemoved = false;
  const newLines = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true; // Start of frontmatter
      } else {
        inFrontmatter = false; // End of frontmatter
        frontmatterRemoved = true;
        // Skip this '---' line and the content before it
        continue;
      }
    }

    if (!inFrontmatter) {
      newLines.push(line);
    }
  }

  // If frontmatter was removed, write the new content back
  if (frontmatterRemoved) {
    // Join lines, remove leading empty lines that might result from frontmatter removal
    const contentWithoutFrontmatter = newLines.join('\n').trimStart();
    fs.writeFileSync(filePath, contentWithoutFrontmatter, 'utf8');
    console.log(`Removed frontmatter from: ${path.basename(filePath)}`);
  } else {
    console.log(
      `No frontmatter found or removed from: ${path.basename(filePath)}`
    );
  }
}

function main() {
  console.log('Starting robust frontmatter removal from Markdown files...');

  // Articles
  const articleFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith('.md'));
  for (const file of articleFiles) {
    removeFrontmatterFromFile(path.join(ARTICLES_DIR, file));
  }

  // Jobs
  const jobFiles = fs
    .readdirSync(JOBS_DIR)
    .filter((file) => file.endsWith('.md'));
  for (const file of jobFiles) {
    removeFrontmatterFromFile(path.join(JOBS_DIR, file));
  }

  console.log('\nRobust frontmatter removal complete!');
}

main();
