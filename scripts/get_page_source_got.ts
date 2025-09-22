import { gotScraping } from 'got-scraping';
import process from 'process';

// Simple argument parsing
if (process.argv.length !== 3) {
    console.error('Usage: ts-node scripts/get_page_source_got.ts <URL>');
    process.exit(1);
}

const url: string = process.argv[2];

(async () => {
    try {
        console.error(`Fetching ${url} with got-scraping...`);
        const { body } = await gotScraping({ url });
        console.log(body);
    } catch (error: any) {
        console.error(`Error fetching page: ${error.message}`);
        process.exit(1);
    }
})();
