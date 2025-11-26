
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { TwitterApi } from 'twitter-api-v2';

// --- SETUP ---

// This script uses the same environment variables as the main posting script.
// Make sure you have them set in your .env.local file.
//
// .env.local
// TWITTER_APP_KEY="YOUR_APP_KEY"
// TWITTER_APP_SECRET="YOUR_APP_SECRET"
// TWITTER_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
// TWITTER_ACCESS_SECRET="YOUR_ACCESS_SECRET"

async function runTest() {
  console.log('Starting Twitter API connection test...');

  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET || !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    console.error('Error: Missing one or more required Twitter environment variables.');
    console.error('Please ensure TWITTER_API_KEY, TWITTER_API_KEY_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET are set in your .env.local file.');
    process.exit(1);
  }

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_KEY_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });

  const readWriteClient = twitterClient.readWrite;

  // --- TWEET CONTENT ---

  const tweet1Text = 'Test Tweet 1/2: This is the first tweet in a test thread from the AI Job Spot application. #Test';
  const tweet2Text = 'Test Tweet 2/2: This is the reply to the first tweet, confirming the threading functionality works. #TestSuccess';

  // --- SCRIPT EXECUTION ---

  try {
    console.log('Attempting to send the first test tweet...');
    const firstTweet = await readWriteClient.v2.tweet(tweet1Text);
    const firstTweetId = firstTweet.data.id;
    console.log('✅ First tweet sent successfully! ID:', firstTweetId);
    console.log(`   View it here: https://twitter.com/anyuser/status/${firstTweetId}`);

    console.log('\nAttempting to send the second test tweet as a reply...');
    const secondTweet = await readWriteClient.v2.tweet(tweet2Text, {
      reply: { in_reply_to_tweet_id: firstTweetId },
    });
    const secondTweetId = secondTweet.data.id;
    console.log('✅ Second tweet (reply) sent successfully! ID:', secondTweetId);
    console.log(`   View it here: https://twitter.com/anyuser/status/${secondTweetId}`);

    console.log('\n🎉 Test complete! The two-tweet thread was posted successfully.');

  } catch (error) {
    console.error('\n❌ An error occurred during the test:');
    // The twitter-api-v2 library often nests the detailed error message
    if (error instanceof Error && error.message.includes('Request failed with code 401')) {
        console.error('Error 401: Unauthorized. This usually means your API keys or tokens are incorrect or lack the required permissions.');
    } else if (error instanceof Error && error.message.includes('Request failed with code 403')) {
        console.error('Error 403: Forbidden. This might mean your app does not have the correct permission level (e.g., you need v2 write access).');
    } else {
        console.error(error);
    }
    process.exit(1);
  }
}

runTest();
