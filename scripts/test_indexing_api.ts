
import { notifyUrlUpdate } from './indexing_api_client.ts';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development.local' });

const TEST_URL = 'https://aijobspot.online/';

async function runTest() {
  console.log(`[Test] Sending test notification for URL: ${TEST_URL}`);
  console.log('--------------------------------------------------');
  
  // Check if the key file path is loaded
  if (!process.env.GOOGLE_INDEXING_KEY_FILE) {
    console.error('[Test FAILED] GOOGLE_INDEXING_KEY_FILE is not defined.');
    console.error('Please ensure you have created a .env.development.local file and set the variable to your key file path.');
    return;
  }

  await notifyUrlUpdate(TEST_URL);
  
  console.log('--------------------------------------------------');
  console.log('[Test] Script finished. Check the output above for success or error messages from the API.');
}

runTest();
