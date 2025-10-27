
// This is an example local configuration file.
// To use it, copy it to `pipeline.config.local.ts` and customize it.
// IMPORTANT: `pipeline.config.local.ts` is in .gitignore and should NOT be committed.

import { IJobSource } from './types.js';
import { Source } from '../lib/types.js'; // Assuming this is the type for briefing sources from Firestore
import { hiringCafeSource } from './sources/hiringCafe.js';

// --- Local Job Source Configuration ---
// This array will be used instead of fetching from the 'job-sources' collection in Firestore.
export const localJobSources: IJobSource[] = [
  {
    ...hiringCafeSource,
    config: {
      ...hiringCafeSource.config,
      // Override or add specific config for local testing
      // For example, limit the number of pages to fetch:
      maxPages: 1, 
    },
  },
  // Example of adding another job source locally:
  // {
  //   name: 'local-test-source',
  //   fetchJobs: async () => {
  //     console.log('Fetching jobs from local test source...');
  //     return [
  //       // return mock job data here
  //     ];
  //   },
  //   transform: (rawJob: unknown) => {
  //     // transform mock job data here
  //     return null;
  //   },
  // },
];


// --- Local Briefing Source Configuration ---
// This array will be used instead of fetching from the 'sources' collection in Firestore.
export const localBriefingSources: Source[] = [
  {
    id: 'local-techcrunch',
    sourceName: 'TechCrunch (Local)',
    feedUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'Article',
    adapter: 'RSS',
    status: 'Active',
    // Add any other required fields from the 'Source' type
    // enabled: true, // This field might be used in the query, ensure it's present
  },
  // Example of another local briefing source
  // {
  //   id: 'local-another-rss',
  //   sourceName: 'Another RSS (Local)',
  //   feedUrl: 'https://example.com/rss',
  //   type: 'Article',
  //   adapter: 'RSS',
  //   status: 'Active',
  //   enabled: true,
  // },
];
