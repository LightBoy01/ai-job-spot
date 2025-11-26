import logger from '../utils/logger.js';
import { IBriefingSource, StandardBriefing, StandardBriefingSchema } from '../types.js';
import { fetchAndParseRss, RssItem } from '../adapters/rss-adapter.js';
import { generateBriefingId } from '../utils/id-generation.js';

/**
 * Transforms a raw RSS item into our StandardBriefing format.
 */
function transform(item: RssItem, sourceName: string): StandardBriefing | null {
    const publishDate = item.isoDate ? new Date(item.isoDate) : new Date();
    const content = item.content || '';
    const briefingId = generateBriefingId(item.link);

    // --- NEW: Robust author handling ---
    let authorName = sourceName; // Default to source name
    if (item.creator) {
        if (typeof item.creator === 'string' && item.creator) {
            authorName = item.creator;
        } else if (
            typeof item.creator === 'object' &&
            item.creator !== null &&
            '_' in item.creator &&
            typeof (item.creator as { _: string })._ === 'string'
        ) {
            authorName = (item.creator as { _: string })._;
        } else if (
            typeof item.creator === 'object' &&
            item.creator !== null &&
            'name' in item.creator &&
            typeof (item.creator as { name: string }).name === 'string'
        ) {
            authorName = (item.creator as { name: string }).name;
        }
    }
    // --- END NEW ---

    const briefingData = {
        id: briefingId,
        title: item.title,
        slug: briefingId,
        author: authorName, // Use the derived author name
        publishDate: publishDate,
        contentType: 'briefing' as const,
        sourceName: sourceName,
        originalUrl: item.link,
        status: (item.contentSnippet || item.content) ? 'pending_review' as const : 'content_incomplete' as const,
        tags: item.categories || [],
        excerpt: item.contentSnippet?.substring(0, 200) || item.content?.substring(0, 200) || '',
        content: content,
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
export function createRssSource(sourceName: string, feedUrl: string): IBriefingSource {
    return {
        name: sourceName,
        
        async fetchItems(): Promise<unknown[]> {
            return fetchAndParseRss(feedUrl);
        },

        transform(rawItem: unknown): StandardBriefing | null {
            // Pass the sourceName to the transform function
            return transform(rawItem as RssItem, sourceName);
        }
    };
}