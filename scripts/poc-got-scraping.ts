
import { gotScraping } from 'got-scraping';

const TEST_URL = 'https://hiring.cafe/api/search-jobs';
// The user must replace this with their actual proxy URL
// e.g., 'http://user:password@host:port'
const PROXY_URL = 'http://your_proxy_url_here'; 

async function runPoc() {
  console.log(`[POC] Starting got-scraping proof of concept with proxy...`);
  
  if (PROXY_URL === 'http://your_proxy_url_here') {
    console.error('[POC] Please replace the PROXY_URL placeholder in the script before running.');
    process.exit(1);
  }

  try {
    const response = await gotScraping({
      url: TEST_URL,
      proxyUrl: PROXY_URL,
      headerGeneratorOptions: {
        browsers: ['chrome'],
        devices: ['desktop'],
        operatingSystems: ['windows'],
      },
    });

    console.log(`[POC] Successfully received a response. Status: ${response.statusCode}`);

    const body = JSON.parse(response.body);
    console.log(`[POC] Successfully parsed response body. Found ${body.length} jobs.`);
    console.log("--- Sample Jobs ---");
    console.log(body.slice(0, 2)); // Log the first 2 jobs to verify content

  } catch (error) {
    console.error(`[POC] An error occurred:`, error);
    process.exit(1);
  }
}

runPoc();
