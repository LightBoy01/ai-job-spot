import { gotScraping } from 'got-scraping';

const API_URL = 'https://hiring.cafe/api/search-jobs';

async function testGotScraping() {
    console.log('[test_got_scraping] Testing hiring.cafe API with got-scraping...');

    try {
        const response = await gotScraping.post({
            url: API_URL,
            json: { size: 1, page: 0, searchState: { sortBy: 'date' } },
            retry: { limit: 3 },
            timeout: { request: 30000 },
        });

        const rawData = response.body;

        console.log('[test_got_scraping] Successfully received and parsed JSON response:');
        console.log(JSON.stringify(rawData, null, 2));

    } catch (error) {
        console.error('[test_got_scraping] An error occurred during the got-scraping fetch:', error);
    }
}

testGotScraping();