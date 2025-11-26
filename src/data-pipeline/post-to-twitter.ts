
import { TwitterApi } from 'twitter-api-v2';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./temp_service_account.json'),
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
    // Quality Gate: Must not have been posted and must have a salary.
    if (!jobData.socialsPosted?.twitter && jobData.salaryRange) {
      console.log(`Found high-quality, unposted job: ${doc.id}`);
      return {
        id: doc.id,
        ...jobData,
      } as Job;
    }
  }

  console.log('Found recent jobs, but none met the criteria (unposted with salary).');
  return null;
}

function formatTweetThread(job: Job): string[] {
  const jobUrl = `https://aijobspot.online/jobs/${job.id}`;
  const hashtags = (job.tags || []).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

  const formatters = [
    // Formatter 1: Classic 3-Tweet Thread
    (j: Job) => {
      console.log('Using format: Classic 3-Tweet Thread');
      const firstTweet = `🚨 New AI Job Opportunity! 🚨\n\nRole: ${j.title}\nCompany: ${j.company}\n\nInterested? Comment below! Link is in the thread 👇`;
      const secondTweet = `Salary: ${j.salaryRange || 'Not specified'}\nLocation: ${j.location}\n\nHelp us spread the word and connect talent with opportunity!`;
      const thirdTweet = `Full details and application link here:\n${jobUrl}\n\n${hashtags}`;
      return [firstTweet, secondTweet, thirdTweet];
    },
    // Formatter 2: Direct & Punchy 2-Tweet Thread
    (j: Job) => {
      console.log('Using format: Direct & Punchy 2-Tweet Thread');
      const firstTweet = `Hiring: ${j.title} at ${j.company}.\n\n📍 ${j.location}\n💰 ${j.salaryRange || 'Competitive'}\n\nApply now & shape the future of AI. Link in next tweet.\n${hashtags}`;
      const secondTweet = `Application link:\n${jobUrl}`;
      return [firstTweet, secondTweet];
    },
    // Formatter 3: Question-based 2-Tweet Thread
    (j: Job) => {
        console.log('Using format: Question-based 2-Tweet Thread');
        const firstTweet = `Ready for your next role in AI?\n\n${j.company} is looking for a ${j.title} in ${j.location}.\n\nCould this be you? Details below 👇\n#AIJobs #Hiring`;
        const secondTweet = `Salary: ${j.salaryRange || 'Not specified'}\n\nFind out more and apply here:\n${jobUrl}\n\n${hashtags}`;
        return [firstTweet, secondTweet];
    },
    // Formatter 4: Single Concise Tweet
    (j: Job) => {
        console.log('Using format: Single Concise Tweet');
        const text = `✨ New AI Job: ${j.title} at ${j.company} (${j.location}). Salary: ${j.salaryRange || 'N/A'}). Apply here: ${jobUrl} ${hashtags}`;
        return [text];
    },
    // Formatter 5: User-provided 2-Tweet Thread
    (j: Job) => {
        console.log('Using format: User-provided 2-Tweet Thread');
        const firstTweet = `🚨 New AI Job Opportunity! 🚨\n\nRole: ${j.title}\nCompany: ${j.company}\nSalary: ${j.salaryRange || 'Not specified'}\nLocation: ${j.location}\n\nInterested? Details below 👇`;
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

async function postTweetThreadWithImage(thread: string[]): Promise<void> {
  console.log('Uploading engagement image...');
  try {
    const mediaId = await rwClient.v1.uploadMedia(fs.readFileSync('public/images/tweet-engagement.png'), { mimeType: 'image/png' });
    console.log(`Successfully uploaded image with media ID: ${mediaId}`);

    console.log(`Posting ${thread.length}-tweet thread with image...`);

    if (thread.length === 1) {
      // For a single tweet, attach the media directly.
      await rwClient.v2.tweet(thread[0], { media: { media_ids: [mediaId] } });
    } else {
      // For a thread, attach the media to the second tweet.
      const threadWithImage = thread.map((text, index) => {
        if (index === 1) {
          return { text, media: { media_ids: [mediaId] as [string] } };
        }
        return { text };
      });
      await rwClient.v2.tweetThread(threadWithImage);
    }

    console.log('Successfully posted tweet thread with image.');
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

    const isDryRun = process.env.DRY_RUN !== 'false';

    if (isDryRun) {
      console.log('--- DRY RUN MODE ---');
      console.log('Would post the following thread:');
      tweetThread.forEach((tweet, index) => {
        console.log(`--- Tweet ${index + 1} ---
${tweet}
`);
      });
      console.log('--- END OF THREAD ---');
      console.log('Would attach image public/images/tweet-engagement.svg to the second tweet.');
      console.log(`Would mark job ${jobToPost.id} as posted.`);
    } else {
      console.log('--- LIVE RUN MODE ---');
      await postTweetThreadWithImage(tweetThread);
      await markJobAsPosted(jobToPost.id);
    }

    console.log('Script finished successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
