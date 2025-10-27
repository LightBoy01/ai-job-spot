import { gotScraping } from 'got-scraping';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import logger from '../utils/logger.js';
import { getDynamicPageSource } from '../utils/crawler.js';

/**
 * Fetches an article URL, using a headless browser fallback for dynamic pages,
 * parses the main content, and converts it to clean Markdown.
 * 
 * @param url The URL of the article to parse.
 * @returns A promise that resolves to the article content in Markdown format.
 */
export async function fetchAndParseArticle(url: string): Promise<string> {
  let html = '';
  const log = logger.child({ parser: 'article-parser', url });

  try {
    log.info(`Fetching with lightweight client`);
    const response = await gotScraping({ url, timeout: { response: 15000 } });
    html = response.body;

    if (html.includes('Enable JavaScript and cookies to continue') || html.includes('__cf_chl_opt')) {
      log.warn(`Cloudflare detected. Falling back to headless browser.`);
      html = await getDynamicPageSource(url);
    }
  } catch (error) {
    log.warn({ err: error }, `Lightweight client failed. Falling back to headless browser.`);
    try {
      html = await getDynamicPageSource(url);
    } catch (execError) {
      log.error({ err: execError }, `Headless browser execution failed`);
      throw new Error(`Both lightweight and headless browser methods failed to fetch ${url}`);
    }
  }

  try {
    log.info(`Parsing content with Readability...`);
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article || !article.content || article.content.length < 100) {
      throw new Error('Could not extract article content using Readability.');
    }

    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    log.info(`Converting HTML to Markdown...`);
    const markdown = turndownService.turndown(article.content);

    if (!markdown || markdown.trim().length < 100) {
        throw new Error(`Generated markdown for ${url} is too short, likely indicating a failed scrape.`);
    }

    return `# ${article.title}\n\n${markdown}`;

  } catch (error) {
    log.error({ err: error }, `Error processing article`);
    throw error;
  }
}
