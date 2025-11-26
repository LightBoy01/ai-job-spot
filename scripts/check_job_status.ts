import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function checkJobStatus() {
  const jobsDir = path.join(process.cwd(), 'src', 'job-descriptions');
  const statusCounts: { [key: string]: number } = {};

  try {
    const files = await fs.readdir(jobsDir);
    let processedFiles = 0;

    for (const file of files) {
      if (path.extname(file) !== '.md') continue;

      const filePath = path.join(jobsDir, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data } = matter(fileContent);

      const status = data.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      processedFiles++;
    }

    console.log('--- Job Status Report ---');
    console.log(`Processed ${processedFiles} markdown files in src/job-descriptions/\n`);

    if (Object.keys(statusCounts).length === 0) {
      console.log('No jobs with a status found.');
    } else {
      console.log('Status Summary:');
      for (const [status, count] of Object.entries(statusCounts)) {
        console.log(`- ${status}: ${count} jobs`);
      }
    }

    const otherStatuses = Object.keys(statusCounts).filter(
      (status) => status !== 'published' && status !== 'pending review'
    );

    if (otherStatuses.length > 0) {
      console.log(`\nWarning: Found jobs with statuses other than 'published' or 'pending review'.`);
    }

  } catch (error) {
    console.error('\nError checking job statuses:', error);
    process.exit(1);
  }
}

checkJobStatus();
