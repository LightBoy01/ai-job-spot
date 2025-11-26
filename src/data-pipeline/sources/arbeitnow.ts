import { fetchJobs } from '../adapters/arbeitnow.js';
import { transform } from '../parsers/arbeitnow.js';

import { IJobSource } from '../types.js';
// --- Config Interface ---
export interface ArbeitnowConfig {
    [key: string]: unknown;
    baseUrl: string;
    keywords?: string[];
    remote?: boolean;
    visa_sponsorship?: boolean;
    maxPages?: number; // Add optional maxPages property
}
export const createArbeitnowSource = (config: ArbeitnowConfig): IJobSource => {
    return {
        name: 'arbeitnow',
        config,
        fetchJobs: () => fetchJobs(config),
        transform: (rawJob: unknown) => transform(rawJob),
    };
};