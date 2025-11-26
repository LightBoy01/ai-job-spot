import Parser from 'rss-parser';
import { z } from 'zod';
import logger from '../utils/logger.js';
import { fetchPageSource } from '../scraping-client.js';

// Zod schema for robust validation of RSS items
const RssItemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  isoDate: z.string().optional(),
  content: z.string().optional(),
  contentSnippet: z.string().optional(),
  creator: z.any().optional(), // Can be a string or an object in some feeds
  categories: z.array(z.string()).optional(),
});

// Define a type for the items we expect from the RSS feed for clarity.
export type RssItem = z.infer<typeof RssItemSchema>;

const parser = new Parser();

/**
 * Fetches and parses an RSS feed from a given URL.
 * @param feedUrl The URL of the RSS feed to parse.
 * @returns A promise that resolves to an array of parsed and validated RSS items.
 */
export async function fetchAndParseRss(feedUrl: string): Promise<RssItem[]> {
  const log = logger.child({ adapter: 'rss-adapter', feedUrl });
  try {
    log.info(`Fetching feed using got-scraping`);
    const xmlString = await fetchPageSource(feedUrl);
    const feed = await parser.parseString(xmlString);


    if (!feed.items || feed.items.length === 0) {
      log.warn(`No items found in feed`);
      return [];
    }

    // Use safeParse to validate each item and filter out invalid ones.
    const validatedItems = feed.items.map(item => {
        const result = RssItemSchema.safeParse(item);
        if (!result.success) {
            log.warn({ err: result.error, itemTitle: item.title }, `Invalid RSS item found. Skipping.`);
            return null;
        }
        return result.data;
    }).filter((item): item is RssItem => item !== null);

    return validatedItems;

  } catch (error) {
    log.error({ err: error }, `Failed to fetch or parse RSS feed`);
    // Re-throw the error to be handled by the calling pipeline
    throw error;
  }
}