import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { TwitterApi } from 'twitter-api-v2';

async function runFinalTest() {
  console.log('Starting final Twitter API connection test...');

  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET || !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    console.error('Error: Missing one or more required Twitter environment variables.');
    process.exit(1);
  }

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const readWriteClient = twitterClient.readWrite;

  const tweet1Text = 'Hello World! This is the first tweet in a final test thread. 1/2';
  const tweet2Text = 'This is the second tweet, confirming write permissions. 2/2';

  try {
    console.log('Attempting to send the first test tweet...');
    const firstTweet = await readWriteClient.v2.tweet(tweet1Text);
    console.log(`✅ First tweet sent successfully! View it at: https://twitter.com/anyuser/status/${firstTweet.data.id}`);

    console.log('\nAttempting to send the second test tweet as a reply...');
    const secondTweet = await readWriteClient.v2.tweet(tweet2Text, {
      reply: { in_reply_to_tweet_id: firstTweet.data.id },
    });
    console.log(`✅ Second tweet (reply) sent successfully! View it at: https://twitter.com/anyuser/status/${secondTweet.data.id}`);

    console.log('\n🎉 Final test complete! Write permissions are confirmed.');

  } catch (error) {
    console.error('\n❌ An error occurred during the final test:', error);
    process.exit(1);
  }
}

runFinalTest();
