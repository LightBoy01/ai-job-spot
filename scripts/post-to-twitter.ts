import { TwitterApi } from 'twitter-api-v2';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }

  // The JSON string from the .env file contains literal newlines, which are invalid.
  // 1. Replace the literal newlines with escaped newlines to make the JSON string valid for parsing.
  const validJsonString = serviceAccountJson.replace(/\n/g, '\\n');

  // 2. Parse the now-valid JSON string.
  const serviceAccount = JSON.parse(validJsonString);

  // 3. The Firebase Admin SDK needs the private key to have actual newlines, not escaped ones.
  //    So, we revert the change for the private_key field.
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = getFirestore();

// Initialize Twitter API Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_KEY_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

const rwClient = twitterClient.readWrite;

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  tags: string[];
  tweetableDescription: string;
  // Add other job fields as necessary
}

async function getUnpostedJob(): Promise<Job | null> {
  console.log('Fetching a batch of recent jobs to find a high-quality candidate...');
  const jobsRef = db.collection('jobs');

  // 1. Fetch a batch of recent jobs that have a company name.
  // This is a simpler query that Firestore supports without complex indexes.
  const snapshot = await jobsRef
    .where('company', '>', '') // Pre-filter for jobs with a company name
    .orderBy('company')
    .orderBy('postedDate', 'desc')
    .limit(50) // Fetch a larger batch to increase the chance of finding a candidate
    .get();

  if (snapshot.empty) {
    console.log('No jobs with a company name were found.');
    return null;
  }

  // 2. Filter the batch in-code to find the first one that meets our quality standards.
  for (const doc of snapshot.docs) {
      const jobData = doc.data();
      // Quality Gate: Must not have been posted, must have a salary.
      if (!jobData.socialsPosted?.twitter && jobData.salaryRange) {
        console.log(`Found high-quality, unposted job: ${doc.id}`);

        // AI-powered summarization of the description
        const description = jobData.description || '';
        let tweetableDesc = jobData.tweetableDescription || '';
        if (!tweetableDesc) {
            tweetableDesc = sanitizeTweetableDescription(description);
        }

        return {
          id: doc.id,
          ...jobData,
          tweetableDescription: tweetableDesc,
        } as Job;
      }
  }

  console.log('Found recent jobs, but none met the criteria (unposted with salary).');
  return null;
}

function sanitizeTweetableDescription(description: string): string {
  // 1. Remove any character that is not a letter, number, space, or one of the following symbols: ., ,, !, ?, #, @, $, %, &, *, (, )
  const sanitized = description.replace(/[^a-zA-Z0-9 \.,!?#@$%&\*\(\)]/g, '');

  // 2. Trim leading and trailing whitespace
  const trimmed = sanitized.trim();

  // 3. Truncate the string to a maximum of 100 characters
  if (trimmed.length > 100) {
    return trimmed.substring(0, 97) + '...';
  }

  return trimmed;
}

function formatTweetThread(job: Job): string[] {
  job.tweetableDescription = sanitizeTweetableDescription(job.tweetableDescription);

  const jobUrl = `https://aijobspot.online/jobs/${job.id}`;  // Strategic Hashtags: Always include #AI and #Jobs, then add job-specific tags.
  const otherHashtags = (job.tags || [])
    .filter(tag => !['ai', 'jobs'].includes(tag.toLowerCase())) // Avoid duplicating #AI, #Jobs
    .map(tag => `#${tag.replace(/\s+/g, '')}`)
    .join(' ');
  const hashtags = `#AI #Jobs ${otherHashtags}`.trim();

  const formatters = [
    // Formatter 1: Inspired by user request - Punchy & Direct
    (j: Job) => {
      console.log('Using format: Punchy Alert');
      const firstTweet = `🚨 AI Job Alert 🚨\n\nRole: ${j.title}\nSalary: ${j.salaryRange || 'Competitive'}\nLocation: ${j.location}\n\nCurious about the company? Full details in the thread. 👇`;
      const secondTweet = `Find out more & apply here:\n${jobUrl}\n\n${hashtags}`;
      return [firstTweet, secondTweet];
    },
    // Formatter 2: Short, Click-worthy & Mobile-friendly
    (j: Job) => {
      console.log('Using format: Quick & Click-worthy');
      const firstTweet = `New AI role just dropped. 🔥\n\nTitle: ${j.title}\n📍 ${j.location}\n💰 ${j.salaryRange || 'Check link'}\n\nFull description and company reveal at the link below. 👇`;
      const secondTweet = `Apply now:\n${jobUrl}\n\n${hashtags}`;
      return [firstTweet, secondTweet];
    },
    // Formatter 3: Question-based to drive engagement
    (j: Job) => {
        console.log('Using format: Engaging Question');
        const firstTweet = `Ready to level up your AI career?\n\nA confidential company is hiring a ${j.title} in ${j.location}.\n\nThink you're a fit? Details below. 👇`;
        const secondTweet = `Salary: ${j.salaryRange || 'Not specified'}\n\nSee the full job description and apply:\n${jobUrl}\n\n${hashtags}`;
        return [firstTweet, secondTweet];
    },
    // Formatter 4: User's Direct Request
    (j: Job) => {
        console.log("Using format: User's Direct Request");
        const firstTweet = `🚨 Job ALERT 🚨\n\nRole: ${j.title}\nSalary: ${j.salaryRange || 'Competitive'}\nLocation: ${j.location}\n\nLet us know if you're interested 👇`;
        const secondTweet = `Apply here: ${jobUrl}\n\n${hashtags}`;
        return [firstTweet, secondTweet];
    },
    // Formatter 5: User-provided 2-Tweet Thread (Company Hidden)
    (j: Job) => {
        console.log('Using format: User-provided 2-Tweet Thread (Company Hidden)');
        const firstTweet = `🚨 New AI Job Opportunity! 🚨\n\nRole: ${j.title}\nSalary: ${j.salaryRange || 'Not specified'}\nLocation: ${j.location}\n\nInterested? Details below 👇`;
        const secondTweet = `Full details and application link here:\n${jobUrl}\n\n${hashtags}`;
        return [firstTweet, secondTweet];
    }
  ];

  // Select a random formatter
  const randomIndex = Math.floor(Math.random() * formatters.length);
  const selectedFormatter = formatters[randomIndex];
  
  console.log(`Formatting job "${job.title}"...`);
  return selectedFormatter(job);
}

async function postTweetThread(thread: string[]): Promise<void> {
  console.log('Posting tweet thread...');
  try {
    console.log(`Posting ${thread.length}-tweet thread...`);

    if (thread.length === 1) {
      // For a single tweet
      await rwClient.v2.tweet(thread[0]);
    } else {
      // For a thread
      await rwClient.v2.tweetThread(thread);
    }

    console.log('Successfully posted tweet thread.');
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    throw error; // Re-throw the error to be caught by the main function
  }
}

async function markJobAsPosted(jobId: string): Promise<void> {
  console.log(`Marking job ${jobId} as posted to Twitter...`);
  await db.collection('jobs').doc(jobId).set(
    {
      socialsPosted: {
        twitter: true,
      },
    },
    { merge: true }
  );
  console.log(`Successfully marked job ${jobId} as posted.`);
}

async function main() {
  console.log('Starting Twitter automation script...');

  try {
    const args = process.argv.slice(2);
    const isLiveRunArg = args.includes('--live');

    const jobToPost = await getUnpostedJob();

    if (!jobToPost) {
      console.log('No new jobs to post. Exiting.');
      return;
    }

    const tweetThread = formatTweetThread(jobToPost);

    if (tweetThread.length === 0) {
      console.error('Failed to format tweet thread. Exiting.');
      return;
    }

    // Determine dry run status based on --live argument
    const isDryRun = !isLiveRunArg; // If --live is NOT present, it's a dry run

    if (isDryRun) {
      console.log('--- DRY RUN MODE ---');
      console.log('Would post the following thread:');
      tweetThread.forEach((tweet, index) => {
        console.log(`--- Tweet ${index + 1} ---\n${tweet}\n`);
      });
      console.log('--- END OF THREAD ---\n');
      console.log(`Would mark job ${jobToPost.id} as posted.`);
    } else {
      console.log('--- LIVE RUN MODE ---');
      await postTweetThread(tweetThread);
      await markJobAsPosted(jobToPost.id);
    }

    console.log('Script finished successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
