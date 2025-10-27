# Spec: Data Pipeline Configuration Loading

## Purpose

This specification describes how the data pipeline loads its source configurations for both jobs and briefings.

## Requirements

### Requirement: Local Caching
The system SHALL use a local file-based cache to store source configurations to minimize reads from Firestore.

#### Scenario: Cache Hit
- GIVEN a valid, non-stale cache file exists in `.cache/data-pipeline/sources.json`
- WHEN the data pipeline is executed without the `--force-refresh` flag
- THEN the pipeline MUST load its source configurations from the local cache file.
- AND the pipeline MUST NOT make a request to Firestore to fetch source configurations.

#### Scenario: Cache Miss (No File)
- GIVEN no cache file exists
- WHEN the data pipeline is executed
- THEN the pipeline MUST fetch its source configurations from Firestore.
- AND the pipeline MUST save the fetched configurations to a new cache file at `.cache/data-pipeline/sources.json`.

#### Scenario: Cache Miss (Stale)
- GIVEN a cache file exists but its timestamp is older than 24 hours
- WHEN the data pipeline is executed without the `--force-refresh` flag
- THEN the pipeline MUST fetch its source configurations from Firestore.
- AND the pipeline MUST overwrite the stale cache file with the newly fetched configurations.

#### Scenario: Cache Bypass
- GIVEN a cache file exists
- WHEN the data pipeline is executed with the `--force-refresh` flag
- THEN the pipeline MUST bypass the cache and fetch its source configurations directly from Firestore.
- AND the pipeline MUST save the fetched configurations to the cache file.

#### Scenario: Corrupted Cache
- GIVEN a cache file exists but contains invalid JSON
- WHEN the data pipeline is executed
- THEN the pipeline MUST treat it as a cache miss and fetch its source configurations from Firestore.
- AND the pipeline MUST overwrite the corrupted cache file with the newly fetched configurations.
