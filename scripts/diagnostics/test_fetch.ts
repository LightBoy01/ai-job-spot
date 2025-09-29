
import { gotScraping } from 'got-scraping';
import util from 'util';

const API_URL = 'https://hiring.cafe/api/search-jobs';

async function testFetch() {
  console.log('[DIAGNOSTIC] Attempting to fetch from hiring.cafe...');
  try {
    const response = await gotScraping.post({
      url: API_URL,
      json: {
        size: 1,
        page: 0,
        searchState: { searchQuery: 'AI', sortBy: 'date' },
      },
      responseType: 'json',
      retry: { limit: 0 }, // No retries for this test
    });
    console.log('[DIAGNOSTIC] Success! Response received:');
    console.log(JSON.stringify(response.body, null, 2));

  } catch (error: unknown) {
    console.error('--- [DIAGNOSTIC] CATCH BLOCK ENTERED --- ');
    
    if (error instanceof Error) {
      console.error('Error is a standard Error instance:');
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    } else {
      console.error('Error is NOT a standard Error instance. Inspecting...');
      
      console.error('\n--- Attempting console.log --- ');
      console.log(error);

      console.error('\n--- Attempting JSON.stringify --- ');
      try {
        console.error(JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        console.error('Failed to stringify the error object.');
      }

      console.error('\n--- Attempting util.inspect --- ');
      try {
        console.error(util.inspect(error, { showHidden: true, depth: null }));
      } catch (inspectError) {
        console.error('Failed to inspect the error object.');
      }
    }
    console.error('--- [DIAGNOSTIC] CATCH BLOCK EXITED --- ');
    // Force a failure exit code
    process.exit(1);
  }
}

testFetch();
