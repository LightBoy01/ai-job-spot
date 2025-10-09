import Parser from 'rss-parser';
const parser = new Parser();
/**
 * Fetches and parses an RSS feed from a given URL.
 * @param feedUrl The URL of the RSS feed to parse.
 * @returns A promise that resolves to an array of parsed RSS items.
 */
export async function fetchAndParseRss(feedUrl) {
    try {
        console.log(`  [RSS Adapter] Fetching feed: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        if (!feed.items || feed.items.length === 0) {
            console.warn(`  [RSS Adapter] No items found in feed: ${feedUrl}`);
            return [];
        }
        // Ensure we only return items that have a title and a link
        return feed.items.filter(item => item.title && item.link);
    }
    catch (error) {
        console.error(`  [RSS Adapter] Failed to fetch or parse RSS feed: ${feedUrl}`, error);
        // Re-throw the error to be handled by the calling pipeline
        throw error;
    }
}
