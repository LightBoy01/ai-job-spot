# Project Plan: Niche Aggregation Pipeline (v2)

This document outlines the plan to build a content aggregation pipeline. The goal is to enrich AI Job Spot with high-quality, niche-focused jobs and articles from external sources, reinforcing our site as a comprehensive authority in the AI career space.

## Guiding Principles
- **Niche-Focused:** All aggregated content must be strictly relevant to AI, machine learning, and data science.
- **Attribute Source:** Always give clear credit to the original source of the content.
- **Value over Volume:** Prioritize a few high-quality feeds over many low-quality ones.
- **Process Defensively:** Assume external feeds can be unreliable, malformed, or change without notice. The pipeline must be resilient.

---

## Phase 1: Source Curation & Tracking

*   **Goal:** Curate a master list of feeds and create a system to track their integration status.
*   **Tasks:**
    *   [x] **Create `SOURCES.md`:** Create a new file, `docs/SOURCES.md`, to be the single source of truth for all feeds. It will contain the feed URL, type (article/job), and a status column (`Pending`, `Integrated`, `Failing`).
    *   [x] **Populate `SOURCES.md`:** Populate the file with feeds from the `allainews_sources` repo and our two confirmed job feeds: `hiring.cafe` (via RSSHub) and `aijobs.net`.

---

## Phase 2: The Standardized RSS Parser

*   **Goal:** Build a single, robust, and defensive parser that can process any standard RSS or Atom feed.
*   **Tasks:**
    *   [x] **Choose Parsing Library:** Select and install a modern, secure, and well-maintained library for parsing RSS/Atom feeds (e.g., `rss-parser`).
    *   [x] **Implement Core Parser:** Build the universal function that takes a feed URL, fetches its content, and parses the XML.
    *   [x] **Implement Data Validation:** Use a schema validation library (e.g., Zod) to ensure essential fields (`title`, `link`) are present and correctly formatted for each item. Items failing validation should be logged and skipped.
    *   [x] **Define Unique ID Strategy:** Implement a function to generate a consistent, unique ID for each item to prevent duplicates. The strategy should be: 1) Use the item's `guid` field if present and valid. 2) Fall back to using the item's `link` (URL) as the ID.

---

## Phase 3: The Pipeline Script

*   **Goal:** Develop a single, performant, and well-documented script that runs the entire aggregation process.
*   **Tasks:**
    *   [x] **Create Master Script:** Develop `src/pipeline/run_aggregation.ts`.
    *   [x] **Read from `SOURCES.md`:** The script will read and parse `docs/SOURCES.md` to get the list of feeds to process.
    *   [x] **Orchestrate Execution:** For each feed, the script will:
        *   Call the Standardized RSS Parser.
        *   Limit processing to the **30 most recent items** per feed to ensure fast, efficient runs.
        *   Wrap the process in a `try...catch` block to handle errors for a single feed without stopping the entire pipeline.
    *   [x] **Save to Firestore:** Use the generated unique ID to save new items to Firestore with `set()`, preventing duplicates.

---

## Phase 4: Frontend Integration & Differentiation

*   **Goal:** Display aggregated content on the site in a way that is distinct from original content.
*   **Tasks:**
    *   [x] **Build "AI News Feed" UI:** Create a compact UI for aggregated articles under a `/news` section, clearly showing the source for each item.
    *   [x] **Differentiate Aggregated Jobs:** Ensure aggregated jobs do not have a "Featured" badge and are displayed after any featured jobs.

---

## Phase 5: Automation & Monitoring

*   **Goal:** Automate the pipeline and implement actionable monitoring and alerts.
*   **Tasks:**
    *   [x] **Set up Scheduled Execution:** Create a GitHub Action to run the `run_aggregation.ts` script on a regular schedule (e.g., every 4 hours).
    *   [x] **Implement Detailed Logging:** On every run, write a summary document to a `pipeline_runs` collection in Firestore. The log should include a timestamp, the overall status (Success/Failure), and an array detailing the outcome for each feed (e.g., `{ source: "url", status: "Success", items_added: 5 }` or `{ source: "url", status: "Error", message: "..." }`).
    *   [x] **Configure Basic Alerts:** Set up a simple alert (e.g., via an email service) to notify an administrator if the entire pipeline script fails to complete.

---

## Phase 6: Admin Panel Integration (Future)

*   **Goal:** Allow non-technical administrators to manage the aggregation pipeline from the website's admin panel.
*   **Tasks:**
    *   [x] **Source Management UI:** Build a UI in the admin panel to perform CRUD (Create, Read, Update, Delete) operations on the list of sources.
        *   [x] **Migrate Sources to Firestore:** Create and run a one-time script to move sources from `SOURCES.md` to a new `sources` collection.
        *   [x] **Refactor Pipeline:** Update `run_aggregation.ts` to read from the `sources` Firestore collection instead of the markdown file.
        *   [x] **Build Admin UI:** Create the user interface in the admin panel for managing sources.
        *   [x] **Build CRUD API:** Develop the API endpoints required for the admin UI to interact with the `sources` collection.
    *   [x] **Manual Trigger Button:** Add a button to the admin panel to manually trigger a pipeline run via a `repository_dispatch` event to the GitHub Action.
    *   [x] **Status Dashboard:** Create a dashboard in the admin panel that reads from the `pipeline_runs` collection to display the history and status of all pipeline runs.