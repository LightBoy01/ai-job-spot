import { exec } from 'child_process';
import util from 'util';
import matter from 'gray-matter';

const execPromise = util.promisify(exec);

const commitHash = '6ce8d3ef3a57186832c83486e1f2baac49986510';
const files = [
  'src/articles/ai-in-cybersecurity.md',
  'src/articles/ai-in-education-personalizing-learning.md',
  'src/articles/ai-in-finance.md',
  'src/articles/echoes-in-the-oracle.md',
  'src/articles/proactive-ai-in-job-industry.md',
  'src/articles/the-anti-portfolio-career.md',
  'src/articles/the-antifragile-career.md',
  'src/articles/the-art-of-strategic-unlearning.md',
  'src/articles/the-emerging-trinity-of-ai-work.md',
  'src/articles/the-empty-cup-intellectual-humility.md',
  'src/articles/the-flexible-mind-cultivating-unlearning.md',
  'src/articles/the-future-of-ai-in-healthcare.md',
  'src/articles/the-gravity-engine.md',
  'src/articles/the-importance-of-soft-skills-in-ai.md',
  'src/articles/the-last-human-frontier-deep-work.md',
  'src/articles/the-law-of-economic-gravity.md',
  'src/articles/the-moral-compass.md',
  'src/articles/the-polymaths-advantage-thriving-in-the-age-of-ai-specialization.md',
  'src/articles/the-polymaths-secret-analogical-thinking.md',
  'src/articles/the-resilient-mind.md',
  'src/articles/the-rise-of-generative-ai.md',
  'src/articles/the-signal-in-the-silence.md',
  'src/articles/the-trust-protocol-human-connection.md',
  'src/articles/the-unseen-hand-ai-logistics.md',
  'src/articles/the-unvarnished-mirror.md',
  'src/articles/the-virtue-of-intellectual-humility.md',
  'src/articles/unseen-foundations-job-industry.md',
];

async function getOriginalIssueNumbers() {
  const issueNoMap = {};
  const missingFrontmatter = [];

  for (const file of files) {
    try {
      const { stdout } = await execPromise(`git show ${commitHash}:${file}`);
      if (stdout.startsWith('---')) {
        const { data } = matter(stdout);
        if (data.issueNo) {
          issueNoMap[file] = data.issueNo;
        } else {
          missingFrontmatter.push(file);
        }
      } else {
        missingFrontmatter.push(file);
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }

  console.log('--- Articles with issueNo ---');
  console.log(JSON.stringify(issueNoMap, null, 2));
  console.log('\n--- Articles missing frontmatter or issueNo ---');
  console.log(JSON.stringify(missingFrontmatter, null, 2));
}

getOriginalIssueNumbers();
