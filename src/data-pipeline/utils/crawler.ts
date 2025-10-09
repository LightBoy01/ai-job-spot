
import { PlaywrightCrawler, playwrightUtils } from 'crawlee';

/**
 * Fetches the fully rendered HTML content of a page using a headless browser.
 * This is a resource-intensive fallback for pages that require JavaScript.
 * @param url The URL to fetch.
 * @returns The HTML content of the page's body.
 */
export async function getDynamicPageSource(url: string): Promise<string> {
  console.log(`[Crawler] Using headless browser for: ${url}`);
  let pageContent = '';

  // PlaywrightCrawler launches a headless browser to render the page.
  const crawler = new PlaywrightCrawler({
    // Lower concurrency to manage memory usage, especially on Termux.
    maxConcurrency: 1,
    // We don't need to follow links, just process the initial page.
    maxRequestsPerCrawl: 1,

    // Use a real browser header to avoid detection.
    preNavigationHooks: [async (crawlingContext) => {
      await playwrightUtils.blockRequests(crawlingContext.page, { 
        urlPatterns: ['.css', '.jpg', '.png', '.svg', '.woff'] 
      });
    }],

    async requestHandler({ page, log }) {
      // Wait for the page to be reasonably loaded.
      await page.waitForLoadState('domcontentloaded');
      // Get the entire body's HTML.
      pageContent = await page.content();
      log.info(`[Crawler] Successfully fetched content for ${url}`);
    },

    failedRequestHandler({ request, log }) {
      log.error(`[Crawler] Request for ${request.url} failed.`);
      throw new Error(`Crawlee failed to fetch ${request.url}`);
    },
  });

  await crawler.run([url]);

  if (!pageContent) {
    throw new Error(`Crawlee ran but failed to extract content from ${url}`);
  }

  return pageContent;
}
