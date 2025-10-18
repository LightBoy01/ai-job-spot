import { fetchAndParseArticle } from './parsers/article-parser.js';
import logger from './utils/logger.js';

const testUrl = 'https://openai.com/index/introducing-gpt-realtime/';

async function runTest() {
  logger.info({ url: testUrl }, '--- Running article parser test ---');
  try {
    const markdown = await fetchAndParseArticle(testUrl);
    logger.info(`Successfully parsed article. Length: ${markdown.length}`);
    if (markdown.length > 500) {
        logger.info('Markdown content seems valid.');
    }
    // console.log(markdown); // Uncomment for debugging
  } catch (error) {
    logger.error({ err: error }, 'Article parser test failed');
  }
}

runTest();