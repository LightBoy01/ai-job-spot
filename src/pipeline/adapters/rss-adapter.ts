import Parser from 'rss-parser';
import { ArticleSchema } from '../schemas.js';

// Initialize the parser
const parser = new Parser();

/**
 * Fetches and parses an RSS feed from a given URL.
 * @param feedUrl The URL of the RSS feed.
 * @returns A promise that resolves to the parsed feed object.
 */
export async function parseRssFeed(feedUrl: string) {
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`Successfully parsed feed: ${feed.title}`);

    const validatedItems = feed.items.map(item => {
      const result = ArticleSchema.safeParse(item);
      if (!result.success) {
        console.warn(`  > Invalid item found in ${feedUrl}:`, result.error.flatten());
        return null;
      }
      return result.data;
    }).filter(item => item !== null);

    return validatedItems;

  } catch (error) {
    console.error(`Failed to parse feed at ${feedUrl}:`, error);
    throw error;
  }
}
