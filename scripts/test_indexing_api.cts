const { notifyUrlUpdate } = require('./indexing_api_client.cts');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config({ path: '.env.development.local' });

const ARTICLES_DIR = path.resolve(process.cwd(), 'src', 'articles');
const SITE_URL = 'https://aijobspot.online';

async function runTest() {
  console.log('[Test] Sending notifications for all articles...');
  console.log('--------------------------------------------------');

  if (!process.env.GOOGLE_INDEXING_KEY_FILE) {
    console.error('[Test FAILED] GOOGLE_INDEXING_KEY_FILE is not defined.');
    console.error(
      'Please ensure you have created a .env.development.local file and set the variable to your key file path.'
    );
    return;
  }

  try {
    const files = await fs.readdir(ARTICLES_DIR);
    const articleSlugs = files.filter(file => file.endsWith('.md')).map(file => path.basename(file, '.md'));

    if (articleSlugs.length === 0) {
      console.warn('[Test] No articles found in src/articles.');
      return;
    }

    console.log(`[Test] Found ${articleSlugs.length} articles to notify.`);

    for (const slug of articleSlugs) {
      const url = `${SITE_URL}/articles/${slug}`;
      await notifyUrlUpdate(url);
    }

  } catch (error) {
    console.error('[Test FAILED] An error occurred while reading the articles directory:', error);
    return;
  }


  console.log('--------------------------------------------------');
  console.log(
    '[Test] Script finished. Check the output above for success or error messages from the API.'
  );
}

runTest();
