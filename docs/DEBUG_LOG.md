## Debugging Session: AI Job Spot Project - Hiring.cafe Scraper & Firestore Seeding

**Date:** August 12, 2025

**Objective:** Debug and enhance the `hiring.cafe` scraper in `run_pipeline.py` to correctly identify and extract AI-related job postings, and ensure proper Firestore database seeding.

**Activities & Resolutions:**

1.  **Initial `hiring.cafe` Scraper Failure:**
    *   **Issue:** `NoSuchElementError` during `hiring.cafe` scraping, indicating website structure changes. Direct links to job details were no longer present on the main page.
    *   **Resolution:** Updated CSS selectors in `stream_hiring_cafe_jobs` to correctly identify job cards, titles, companies, locations, salaries, and tags on the main page.
    *   **Limitation:** Direct navigation to job detail pages via simple clicks was not feasible due to complex JavaScript handling.
    *   **Workaround:** Implemented a strategy to extract all available information from the main page.

2.  **AI Keyword Filtering & Google Search Integration (Attempt 1 - Failed):**
    *   **Issue:** Attempted to integrate AI keyword filtering and Google search/web fetch directly within `stream_hiring_cafe_jobs`. This resulted in `NameError: name 'default_api' is not defined` because direct tool calls are not supported within the executed Python script.
    *   **Resolution:** Realized the need for an inter-process communication strategy.

3.  **AI Keyword Filtering & Google Search Integration (Attempt 2 - Current Strategy):**
    *   **Strategy:** Modified `stream_hiring_cafe_jobs` to:
        *   Filter job titles for AI-related keywords ("AI", "Machine Learning", "Data Scientist", "AI Engineer", "Data Engineer").
        *   For each relevant job, print a structured `SEARCH_QUERY::` string to `stdout` containing the job title and company.
    *   **CLI Role:** The CLI will capture these `SEARCH_QUERY::` strings, perform `google_web_search`, `web_fetch` the most relevant link, extract the summary, and then append the enriched job data to `final_jobs.json`.
    *   **Outcome:** `run_pipeline.py` now successfully identifies and outputs search queries for AI-related jobs from `hiring.cafe`.

4.  **`seedFirestore.js` Debugging:**
    *   **Issue 1:** `Error: Cannot find module '@faker-js/faker'`.
    *   **Resolution 1:** Installed missing module via `npm install @faker-js/faker`.
    *   **Issue 2:** `SyntaxError: Unexpected token '‎'` when running `seedFirestore.js`. Caused by an invisible Unicode character in the `FIREBASE_SERVICE_ACCOUNT` environment variable.
    *   **Resolution 2:** Instructed user to manually clean the environment variable.
    *   **File Location Confusion:** Clarified that the correct `seedFirestore.js` file was located in the `docs` directory, not the project root.
    *   **Resolution:** Deleted the incorrect `seedFirestore.js` from the project root and moved the correct one from `docs` to the project root.
    *   **Outcome:** `seedFirestore.js` now runs successfully and seeds the Firebase database.

5.  **Job Data Enrichment (CLI-side):**
    *   **Process:** Captured `SEARCH_QUERY::` output from `run_pipeline.py`.
    *   **Example:** Processed "Data Engineer Lead at Aios Medical" job.
    *   **Google Search:** Successfully performed Google search for the job.
    *   **Web Fetch:** Attempted to fetch from `wellfound.com` (redirected to general page). Successfully fetched from `joinrise.co` and extracted summary.
    *   **Outcome:** The "Data Engineer Lead" job from `hiring.cafe` was successfully added to `final_jobs.json` with its summary and a direct link.

**Next Steps:**

*   Continue processing remaining `hiring.cafe` search queries (if any).
*   Process `foorilla.com` and RSS feed jobs.
*   Finalize `final_jobs.json`.