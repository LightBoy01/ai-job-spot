# Detailed Refactoring Plan

This document outlines the specific actions to be taken to refactor the data pipeline, fulfilling Task 1.4.

## 1. Consolidate Seeder Scripts

-   **Problem:** There are two seeder files, `seedFirestore.ts` and `seedFirestore.cts`, with overlapping but different implementations.
-   **Action:** The logic from `seedFirestore.ts` will be considered the primary source of truth. The `seedFirestore.cts` file will be deleted. The `package.json` script for `seed` will be updated to ensure it correctly compiles and runs the single `.ts` file.
-   **Files to Modify:** `package.json`
-   **Files to Delete:** `seedFirestore.cts`

## 2. Refactor `main.ts` Orchestrator

-   **Problem:** The `runSource` function in `main.ts` is doing too much (fetching, archiving, processing). It's hard to read and test.
-   **Action:** `runSource` will be broken down into smaller, more focused functions:
    -   `fetchRemoteItems(source)`: Handles fetching from the source adapter.
    -   `archiveStaleItems(localFiles, remoteIds, archiveDir)`: Handles the logic for archiving.
    -   `processAndWriteItems(remoteItems, source, writeFn)`: Handles the transformation, error handling (DLQ), and writing of files.
    -   The main `runSource` function will become a simple orchestrator that calls these smaller functions.
-   **Files to Modify:** `src/data-pipeline/main.ts`

## 3. Centralize and Abstract Configuration

-   **Problem:** The logic for handling the local cache and fetching from Firestore is spread between `pipeline.config.jobs.ts`, `pipeline.config.briefings.ts`, and `utils/source-cache.ts`.
-   **Action:**
    -   Create a new utility file, `src/data-pipeline/utils/source-provider.ts`.
    -   This file will contain a `getSourceConfigs(type, forceRefresh)` function that completely abstracts the caching logic. It will be the single point of contact for fetching configurations.
    -   `pipeline.config.jobs.ts` and `pipeline.config.briefings.ts` will be simplified to only contain their specific Zod schemas and call this new provider function.
-   **Files to Create:** `src/data-pipeline/utils/source-provider.ts`
-   **Files to Modify:** `src/data-pipeline/pipeline.config.jobs.ts`, `src/data-pipeline/pipeline.config.briefings.ts`

## 4. Unify and Improve Type Safety

-   **Problem:** Some types are defined manually in `types.ts` and then have a corresponding Zod schema. This can lead to them getting out of sync.
-   **Action:** Where possible, we will define the Zod schema as the source of truth and use `z.infer<typeof Schema>` to generate the TypeScript type. This will be applied to `StandardJob` and `StandardBriefing` in `src/data-pipeline/types.ts`.
-   **Files to Modify:** `src/data-pipeline/types.ts`

## 5. Enhance Logging

-   **Problem:** Logging is good but can be more structured, especially around decisions.
-   **Action:** Add specific, structured log entries at key decision points, such as when the cache is used, when it's bypassed, and when a source is skipped due to invalid configuration.
-   **Files to Modify:** `src/data-pipeline/utils/source-provider.ts`, `src/data-pipeline/main.ts`
