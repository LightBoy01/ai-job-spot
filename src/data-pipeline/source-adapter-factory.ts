import { IJobSource, IBriefingSource, PlaywrightSourceConfig } from './types.js';
import { hiringCafeSource } from './sources/hiringCafe.js';
import { createRssSource } from './sources/rss.js';
import { createPlaywrightSource } from './sources/playwright.js';
import { createGoogleCseSource, GoogleCseConfig } from './sources/google-cse.js';
import { createArbeitnowSource, ArbeitnowConfig } from './sources/arbeitnow.js';
import logger from './utils/logger.js';

/**
 * Represents the structure of a configuration object for a source,
 * which can be for either a job or a briefing.
 */
export interface SourceConfig {
    name: string;
    adapter: string;
    config?: Record<string, unknown>;
    // Briefing-specific properties
    feedUrl?: string;
    baseUrl?: string;
    keywords?: string[];
    remote?: boolean;
    visa_sponsorship?: boolean;
}

/**
 * A factory to map an adapter name and its configuration to a fully
 * constructed source implementation (either IJobSource or IBriefingSource).
 * This is the central registry for all data sources in the pipeline.
 */
export const sourceAdapterFactory = {
    createSource: (sourceConfig: SourceConfig): IJobSource | IBriefingSource | null => {
        switch (sourceConfig.adapter) {
            case 'HiringCafe':
                // For static sources, we merge the DB config with the base adapter.
                return {
                    ...hiringCafeSource,
                    config: {
                        ...(hiringCafeSource.config || {}),
                        ...sourceConfig.config,
                    },
                };

            case 'RSS':
                // For dynamic sources like RSS, we use a creator function.
                if (!sourceConfig.feedUrl) {
                    logger.warn({ source: sourceConfig.name }, `[AdapterFactory] RSS source is missing a feedUrl.`);
                    return null; // RSS adapter requires a feedUrl
                }
                return createRssSource(sourceConfig.name, sourceConfig.feedUrl);

            case 'Playwright':
                // For Playwright sources, we validate the config and create a source.
                const playwrightConfig = sourceConfig.config as unknown as PlaywrightSourceConfig;
                if (!playwrightConfig || !playwrightConfig.url || !playwrightConfig.selectors) {
                    logger.warn({ source: sourceConfig.name }, `[AdapterFactory] Playwright source is missing required config (url, selectors).`);
                    return null;
                }
                playwrightConfig.sourceName = sourceConfig.name;
                return createPlaywrightSource(sourceConfig.name, playwrightConfig);

            case 'GoogleCSE':
                // For Google CSE sources, we validate the config and create a source.
                const googleCseConfig = sourceConfig.config as unknown as GoogleCseConfig;
                if (!googleCseConfig || !googleCseConfig.apiKey || !googleCseConfig.cseId || !googleCseConfig.query) {
                    logger.warn({ source: sourceConfig.name }, `[AdapterFactory] Google CSE source is missing required config (apiKey, cseId, query).`);
                    return null;
                }
                return createGoogleCseSource(sourceConfig.name, googleCseConfig);


            case 'Arbeitnow':
                // For Arbeitnow sources, we validate the config and create a source.
                const arbeitnowConfig: ArbeitnowConfig = {
                    baseUrl: sourceConfig.config?.baseUrl as string,
                    keywords: sourceConfig.config?.keywords as string[],
                    remote: sourceConfig.config?.remote as boolean,
                    visa_sponsorship: sourceConfig.config?.visa_sponsorship as boolean,
                    maxPages: sourceConfig.config?.maxPages as number | undefined,
                };
                if (!arbeitnowConfig.baseUrl) {
                    logger.warn({ source: sourceConfig.name }, `[AdapterFactory] Arbeitnow source is missing required config (baseUrl).`);
                    return null;
                }
                return createArbeitnowSource(arbeitnowConfig);

            // To add a new source type, add a case here.
            // case 'YourNewSource':
            //     return yourNewSourceAdapter;

            default:
                logger.warn({ source: sourceConfig.name, adapter: sourceConfig.adapter }, `[AdapterFactory] Unknown adapter type specified.`);
                return null;
        }
    }
};