# Change Proposal: Fix Firestore Quota Errors with Caching

## 1. The Why

The data pipeline currently fetches its source configurations (for both jobs and briefings) directly from Firestore every time it runs. This has led to repeated `RESOURCE_EXHAUSTED` errors, as we are exceeding the daily read quota for the Firestore free tier. This blocks all data pipeline operations and prevents us from updating the website's content.

## 2. The What

This change introduces a local, file-based caching layer for the source configurations. The goal is to dramatically reduce Firestore read operations, making the pipeline more resilient, faster, and cost-effective.

## 3. The How

The pipeline will be modified to first check for a local cache of the source configurations. 

- If a valid, non-stale cache exists, it will be used, and no Firestore read will occur.
- If the cache does not exist or is stale (older than 24 hours), the pipeline will fetch the configurations from Firestore as it does now.
- After a successful fetch from Firestore, the new configurations will be saved to the local cache for subsequent runs.

A `--force-refresh` command-line flag will be added to allow for manual bypassing of the cache when immediate updates are needed.

## 4. Acceptance Criteria

- The data pipeline (both jobs and briefings) must run without Firestore quota errors when a local cache is present.
- The pipeline must successfully fetch from Firestore and create a cache file if one does not exist.
- The pipeline must bypass the cache and fetch from Firestore when the `--force-refresh` flag is used.
- The caching logic must be robust enough to handle potential file system errors (e.g., corrupted cache file).
