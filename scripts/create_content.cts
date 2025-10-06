const fs = require('fs/promises');
const path = require('path');
const readline = require('readline');
const { randomBytes } = require('crypto');

const projectRoot = process.cwd();
const articlesDir = path.join(projectRoot, 'src', 'articles');
const jobsDir = path.join(projectRoot, 'src', 'job-descriptions');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateUniqueSlug(
  title: string,
  dir: string,
  isJob: boolean
): Promise<string> {
  let baseSlug = slugify(title);
  if (isJob) {
    baseSlug = `job-${baseSlug}`;
  }
  let finalSlug = baseSlug;
  let counter = 1;
  while (await checkFileExists(path.join(dir, `${finalSlug}.md`))) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return finalSlug;
}

const getArticleBoilerplate = (slug: string, title: string) => `---
slug: '${slug}'
title: '${title}'
author: 'Your Name'
publishDate: '${new Date().toISOString()}'
issueNo: 1
volumeNo: 1
tags: ['AI', 'New']
imageUrl: '/images/articles/placeholder.jpg'
excerpt: 'A brief and compelling summary of this new article.'
author_take_question1: 'What is the core message you want readers to take away?'
author_take_answer1: ''
author_take_question2: 'What is a surprising or counter-intuitive insight in this article?'
author_take_answer2: ''
---

### Section 1

Content begins here.

[[Internal Link: an-existing-article-slug]]
`;

const getJobBoilerplate = (slug: string, title: string) => `---
id: '${slug}'
title: '${title}'
company: 'Company Name'
location: 'City, State or Remote'
applicationLink: 'https://example.com/apply'
postedDate: '${new Date().toISOString()}'
expirationDate: null
tags: ['Full-time', 'ML', 'Engineering']
status: 'open'
jobLevel: 'Mid-level'
employeeRole: 'Engineer'
salaryRange: '$100,000 - $150,000'
source: 'Direct'
glassdoorLink: null
crunchbaseLink: null
companyLogoUrl: null
applicationExperience: 'Applied via company website.'
story_question1: 'What makes this role exciting?'
story_answer1: ''
story_question2: 'What is the company culture like?'
story_answer2: ''
story_question3: 'What impact will this role have?'
story_answer3: ''
---

A brief, one-paragraph overview of the role.

### Responsibilities
- Responsibility 1
- Responsibility 2

### Qualifications
- Qualification 1
- Qualification 2
`;

async function main() {
  try {
    const type = await question('Create a (j)ob or an (a)rticle? ');
    const title = await question('Enter the title: ');

    if (!title) {
      console.error('Title cannot be empty.');
      return;
    }

    let dir, boilerplate, isJob;
    if (type.toLowerCase() === 'a') {
      dir = articlesDir;
      isJob = false;
      const slug = await generateUniqueSlug(title, dir, isJob);
      boilerplate = getArticleBoilerplate(slug, title);
      console.log(`Creating new article in: ${path.join(dir, `${slug}.md`)}`);
      await fs.writeFile(path.join(dir, `${slug}.md`), boilerplate);
      console.log('Article file created successfully!');
    } else if (type.toLowerCase() === 'j') {
      dir = jobsDir;
      isJob = true;
      const slug = await generateUniqueSlug(title, dir, isJob);
      boilerplate = getJobBoilerplate(slug, title);
      console.log(`Creating new job in: ${path.join(dir, `${slug}.md`)}`);
      await fs.writeFile(path.join(dir, `${slug}.md`), boilerplate);
      console.log('Job file created successfully!');
    } else {
      console.error(
        'Invalid type. Please enter "j" for job or "a" for article.'
      );
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();
