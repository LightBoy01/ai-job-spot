# Implementation Tasks: Fix Firestore Quota Errors with Caching

## 1. Create the Caching Utility

- [x] 1.1. Create a new file at `src/data-pipeline/utils/source-cache.ts`.
- [x] 1.2. In this file, define the `CachedSourceData` interface.
- [x] 1.3. Implement the `saveSourcesToCache` function to write source configurations to a JSON file in the `.cache/data-pipeline/` directory.
- [x] 1.4. Implement the `loadSourcesFromCache` function to read from the cache file.
- [x] 1.5. The `loadSourcesFromCache` function must check if the cache is stale (older than 24 hours) and return `null` if it is.
- [x] 1.6. The `loadSourcesFromCache` function must handle cases where the cache file doesn't exist or is corrupted.

## 2. Integrate Caching into the Jobs Pipeline

- [x] 2.1. In `src/data-pipeline/pipeline.config.jobs.ts`, import the caching functions.
- [x] 2.2. Modify the `getJobSources` function to implement the caching logic:
- [x] 2.2.1. Check for a `--force-refresh` command-line flag.
- [x] 2.2.2. If the flag is not present, attempt to load sources from the cache.
- [x] 2.2.3. If cached sources are found, return them.
- [x] 2.2.4. If no valid cache is found, fetch from Firestore.
- [x] 2.2.5. After fetching from Firestore, save the results to the cache using `saveSourcesToCache`.

## 3. Integrate Caching into the Briefings Pipeline

- [x] 3.1. In `src/data-pipeline/pipeline.config.briefings.ts`, import the caching functions.
- [x] 3.2. Modify the `getBriefingSources` function to implement the same caching logic as the jobs pipeline.

## 4. Verification

- [ ] 4.1. Run the `jobs` pipeline. The first run is expected to fail due to the Firestore quota, but it should create the cache.
- [ ] 4.2. Run the `jobs` pipeline again. It should now use the cache and run successfully.
- [ ] 4.3. Run the `jobs` pipeline with the `--force-refresh` flag. It should bypass the cache and fail with a Firestore quota error.
- [ ] 4.4. Repeat the verification steps for the `briefings` pipeline.
