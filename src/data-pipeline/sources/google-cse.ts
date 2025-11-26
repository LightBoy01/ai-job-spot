
import { IJobSource, StandardJob, StandardJobSchema } from '../types.js';
import { gotScraping } from 'got-scraping';
import logger from '../utils/logger.js';

// Type definitions for the Google Custom Search API response
interface GoogleSearchItem {
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
        metatags?: {
            'og:description'?: string;
        }[];
    };
}

interface GoogleSearchResponse {
    items?: GoogleSearchItem[];
}

// Interface for the configuration required by this source
export interface GoogleCseConfig {
    [key: string]: string;
    apiKey: string;
    cseId: string;
    query: string;
}


export const createGoogleCseSource = (name: string, config: GoogleCseConfig): IJobSource => {
    const { apiKey, cseId, query } = config;

    return {
        name,
        config,
        fetchJobs: async (): Promise<unknown[]> => {
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;
            
            logger.info({ source: name, url: searchUrl }, `[GoogleCSE] Fetching jobs from Google Custom Search API.`);

            const response = await gotScraping.get(searchUrl).json<GoogleSearchResponse>();
            return response.items || [];
        },
        transform: (rawJob: unknown): StandardJob | null => {
            const item = rawJob as GoogleSearchItem;

            // Basic transformation from the search result
            const title = item.title.split(' - Indeed.com')[0];
            const companyMatch = item.snippet.match(/^(.*?)\s-/);
            const company = companyMatch ? companyMatch[1] : 'Unknown';
            const locationMatch = item.snippet.match(/-\s(.*?)\s-/);
            const location = locationMatch ? locationMatch[1] : 'Unknown';

            // This is a simplified transformation. We'll need to fetch the actual page
            // to get the full description and application link.
            // For now, we'll create a placeholder.

            const job: Partial<StandardJob> = {
                id: item.link, // Use the URL as the initial ID
                title: title,
                company: company,
                location: location,
                applicationLink: item.link,
                postedDate: new Date().toISOString(), // Placeholder
                expirationDate: null,
                tags: [],
                status: 'pending_review',
                jobLevel: null,
                employeeRole: null,
                salaryRange: null,
                source: name,
                sourceUrl: item.link,
                companyLogoUrl: null,
                description: item.snippet, // Use snippet as placeholder
                responsibilities: [],
                qualifications: [],
            };
            
            // We can't do a full transformation without fetching the detail page.
            // The architecture supports this, but for a first pass, we'll return the partial data.
            // A future enhancement would be to call `fetchJobDetails` here.

            const validation = StandardJobSchema.safeParse(job);
            if (!validation.success) {
                logger.warn({ err: validation.error, rawJob: item }, `[GoogleCSE] Transformed job failed validation.`);
                return null;
            }

            return validation.data;
        },
    };
};
