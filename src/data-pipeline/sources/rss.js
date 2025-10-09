import crypto from 'crypto';
import { StandardBriefingSchema } from '../types.js';
import { fetchAndParseRss } from '../adapters/rss-adapter.js';
function generateBriefingId(originalUrl) {
    const hash = crypto.createHash('sha256').update(originalUrl).digest('hex');
    return `briefing-${hash}`;
}
/**
 * Transforms a raw RSS item into our StandardBriefing format.
 */
function transform(rawItem, sourceName) {
    // We cast to RssItem, but a more robust implementation would parse this with Zod.
    // For this refactoring, we'll keep it as a cast to mirror the original logic.
    const item = rawItem;
    const briefingId = generateBriefingId(item.link);
    // --- NEW: Robust author handling ---
    let authorName = sourceName; // Default to source name
    if (item.creator) {
        if (typeof item.creator === 'string' && item.creator) {
            authorName = item.creator;
        }
        else if (typeof item.creator === 'object' &&
            item.creator !== null &&
            '_' in item.creator &&
            typeof item.creator._ === 'string') {
            authorName = item.creator._;
        }
        else if (typeof item.creator === 'object' &&
            item.creator !== null &&
            'name' in item.creator &&
            typeof item.creator.name === 'string') {
            authorName = item.creator.name;
        }
    }
    // --- END NEW ---
    const briefingData = {
        id: briefingId,
        title: item.title,
        slug: briefingId,
        author: authorName, // Use the derived author name
        publishDate: item.isoDate ? new Date(item.isoDate) : new Date(),
        contentType: 'briefing',
        sourceName: sourceName,
        originalUrl: item.link,
        status: (item.contentSnippet || item.content) ? 'pending_review' : 'content_incomplete',
        tags: item.categories || [],
        excerpt: item.contentSnippet?.substring(0, 200) || item.content?.substring(0, 200) || '',
        content: item.content || '',
    };
    if (briefingData.status === 'content_incomplete') {
        briefingData.tags.push('needs-content-review');
    }
    // Validate against the Zod schema before returning
    return StandardBriefingSchema.parse(briefingData);
}
/**
 * Creates a briefing source object for a given RSS feed.
 * This factory pattern allows us to create multiple RSS sources with different feed URLs.
 * @param sourceName - The unique name for this source (e.g., 'TechCrunch').
 * @param feedUrl - The URL of the RSS feed.
 * @returns An object that conforms to the IBriefingSource interface.
 */
export function createRssSource(sourceName, feedUrl) {
    return {
        name: sourceName,
        async fetchItems() {
            return fetchAndParseRss(feedUrl);
        },
        transform(rawItem) {
            // Pass the sourceName to the transform function
            return transform(rawItem, sourceName);
        }
    };
}
