// Threshold in milliseconds for a job to be considered "new" (e.g., 3 days)
export const NEW_JOB_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

// Threshold in days for a job to be considered "expiring soon"
export const EXPIRES_SOON_THRESHOLD_DAYS = 7;

export const JOB_FETCH_LIMIT = 9;
export const ARTICLE_FETCH_LIMIT = 9;

// The minimum number of jobs a pSEO page must have to be considered for indexing.
export const PSEO_MIN_JOB_COUNT = 3;

export const HUBS = [
  'Mental Models & Frameworks',
  'Career & Professional Strategy',
  'The Human Advantage',
  'AI & The World'
];
