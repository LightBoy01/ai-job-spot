import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';

const jobDescriptionsDir = path.resolve(process.cwd(), 'src/job-descriptions');

async function publishJobs() {
  try {
    const files = await fs.readdir(jobDescriptionsDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    for (const file of markdownFiles) {
      const filePath = path.join(jobDescriptionsDir, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      if (data.status === 'pending_review') {
        data.status = 'published';
        const newContent = matter.stringify(content, data);
        await fs.writeFile(filePath, newContent);
        console.log(`Published job: ${file}`);
      }
    }
    console.log('Job publishing process completed.');
  } catch (error) {
    console.error('Error publishing jobs:', error);
  }
}

publishJobs();
