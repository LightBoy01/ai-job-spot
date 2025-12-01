# RSS-Bridge & RSSHub Integration Strategy

## 1. Objective

To integrate RSS-Bridge and RSSHub as scalable sources for the data pipeline to increase the volume and variety of both job and briefing content, while ensuring the process is robust, secure, and maintainable.

## 2. Red Team Analysis & Mitigation

This plan has been "red-teamed" to identify and mitigate risks before implementation.

### Phase 1: External Setup & Source Identification

*   **Risk (Deployment & Maintenance):** Self-hosting RSS-Bridge/RSSHub carries an operational burden.
    *   **Mitigation:** Start with a simple, low-cost Docker deployment. Acknowledge that this is core infrastructure that requires a maintenance plan.
*   **Risk (Source Reliability & Quality):** "Bridges" are fragile and can break when target sites change. Feed quality may be poor.
    *   **Mitigation:** Do not assume feeds are stable. Manually inspect each generated feed for quality before adding it. Accept that "bridge maintenance" will be a recurring task.

### Phase 2: Proof of Concept - Briefing Integration

*   **Risk (Transform Incompatibility):** The existing `RSS` adapter may not be compatible with the XML structure of bridged feeds.
    *   **Mitigation:** Before a full pipeline run, use a small test script to validate the `transform` function on a single item from a new feed.
*   **Risk (ID Uniqueness):** Bridged feeds may not have stable permalinks, leading to content duplication.
    *   **Mitigation:** Verify link stability during testing. If unstable, develop an alternative ID generation strategy (e.g., hash of title + date).

### Phase 3: The Challenge - Job Integration

*   **Risk (Catastrophic Data Mismatch):** Ingesting job feeds with the wrong transformer could create nonsensical, garbage data.
    *   **Mitigation:** Implement and enforce a `--dry-run` flag for the pipeline that prints transformed data to the console without writing to the filesystem or database. This is a mandatory safety check.
*   **Risk (Complexity of Job Parsing):** Parsing structured job data (company, salary) from unstructured HTML is a hard problem.
    *   **Mitigation:** We will create a new, dedicated `RSS_JOB` adapter. We will develop it iteratively:
        1.  **Iteration 1:** Extract only the `title` and `applicationLink`.
        2.  **Iteration 2+:** Incrementally add logic to parse more complex fields like `company`, `location`, etc.

### Cross-Cutting Concerns

*   **Security:** Deployed services must be firewalled and updated. The pipeline's existing `DOMPurify` sanitization of all incoming content is critical.
*   **Legal & Ethical:** Avoid scraping sites that explicitly forbid it. Be prepared to remove any source upon request.

## 3. Firestore Read Quota Management Strategy

To avoid hitting Firestore's free-tier read quota, we will employ a caching strategy.

1.  **The Cache:** The pipeline automatically caches the source configuration from Firestore into a local file on the first run. Subsequent runs read from this local file, incurring **zero** database reads.
2.  **The Control:** The `--force-refresh` flag is used to bypass the cache and fetch the latest configuration from Firestore.
3.  **The Workflow:**
    *   **Batch Changes:** Add new sources in batches to Firestore.
    *   **Refresh Once:** Run the pipeline *once* with `--force-refresh` to update the local cache.
    *   **Run from Cache:** Use the default command (no flag) for all routine runs.

## 4. The Phased Implementation Plan

We will proceed phase by phase, with a strategic review at the end of each phase before proceeding to the next.

### Phase 1: External Setup & Source Identification
- [ ] **1.1:** Deploy self-hosted instances of RSS-Bridge and/or RSSHub.
- [ ] **1.2:** Identify 2-3 briefing sources and 1-2 job sources.
- [ ] **1.3:** Generate custom RSS feed URLs for these sources.
- [ ] **Strategic Review:** Confirm deployment is stable and feeds are of acceptable quality.

### Phase 2: Proof of Concept - Briefing Integration
- [ ] **2.1:** Add one new briefing source to the Firestore `sources` collection.
- [ ] **2.2:** Run the briefings pipeline (`npm run pipeline:briefings`).
- [ ] **2.3:** Verify the successful creation of a new, correctly formatted markdown file in `src/content/briefings`.
- [ ] **Strategic Review:** Confirm the `RSS` adapter works as expected.

### Phase 3: The Challenge - Job Integration
- [ ] **3.1:** Implement the `--dry-run` flag in the pipeline's main script.
- [ ] **3.2:** Create the new `RSS_JOB` adapter file (`src/data-pipeline/sources/rss-job.ts`) with an initial "minimal" transform function (extracting only title and link).
- [ ] **3.3:** Wire the new adapter into the `source-adapter-factory.ts`.
- [ ] **3.4:** Add one new job source to Firestore with the `RSS_JOB` adapter type.
- [ ] **3.5:** Run the jobs pipeline with `--dry-run` to verify the transformed output.
- [ ] **3.6:** Run the full jobs pipeline and verify the creation of a minimal, but correct, job markdown file.
- [ ] **Strategic Review:** Confirm the new adapter works and plan the next iteration for parsing more fields.

### Phase 4: Full-Scale Rollout
- [ ] **4.1:** Add all remaining desired sources to Firestore.
- [ ] **4.2:** Run both pipelines to ingest all new content.
- [ ] **4.3:** Verify all content is ingested correctly.
- [ ] **Strategic Review:** Final review of the integration. The system is now fully operational.
