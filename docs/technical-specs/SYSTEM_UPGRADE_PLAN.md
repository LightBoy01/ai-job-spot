# System Upgrade & Architecture Plan

**Subject:** A detailed, phased, and trackable plan for the next-generation upgrades to the AI Job Spot platform.
**Date:** 2025-11-02
**Status:** Approved

---

## 1. Overview

This document outlines the approved master plan for significant architectural and functional upgrades to the platform. The plan is the result of a comprehensive review of the Admin Panel, content pipelines, and data processing workflows. It also incorporates a "red team" analysis to ensure the proposed architecture is robust, scalable, and secure.

The plan is broken down into six distinct phases, designed to be implemented sequentially.

---

## 2. The Phased Implementation Plan

### **Phase 1: Architecture Unification & Core UX (Technical Debt Pay-down)**

**Goal:** Unify the admin panel's codebase onto a single, superior architecture to improve maintainability and implement high-value user experience features that are currently missing.

*   **1.1: Refactor Article Forms to `react-hook-form` & `zod`**
    *   `[ ]` **1.1.1:** Create a new Zod schema for article validation in `src/lib/validationSchemas.ts`.
    *   `[ ]` **1.1.2:** Refactor the "New Article" page (`src/pages/admin/articles/new.tsx`) to use `react-hook-form` and the new Zod schema.
    *   `[ ]` **1.1.3:** Refactor the "Edit Article" page (`src/pages/admin/articles/edit/[slug].tsx`) to use the same `react-hook-form` pattern.
    *   `[ ]` **1.1.4:** Abstract all API submission logic into `createArticle` and `updateArticle` functions in `@/lib/adminApi`.

*   **1.2: Implement Critical Admin UX Improvements**
    *   `[ ]` **1.2.1:** Add a "Forgot Password?" link and associated password-reset workflow to the `login.tsx` page.
    *   `[ ]` **1.2.2:** Implement a utility to auto-generate the URL slug from the title field on the "New Article" form.
    *   `[ ]` **1.2.3:** Add the `watch()`-based "Live Preview" functionality to the "Edit Job" page to ensure UI consistency.

### **Phase 2: Location Slug Implementation**

**Goal:** Improve SEO and URL readability by replacing URL-encoded location names with clean, human-readable slugs (e.g., `Remote%2C%20US` becomes `remote-us`).

*   **2.1: Update Data Structure**
    *   `[ ]` **2.1.1:** Add a new `locationSlug` field to the `JobPosting` type in `src/lib/types.ts` and the `JobPostingSchema` in `src/lib/validationSchemas.ts`.

*   **2.2: Update Data Writing Logic**
    *   `[ ]` **2.2.1:** Modify the `seedFirestore.ts` script to generate and save the `locationSlug` when processing job markdown files.
    *   `[ ]` **2.2.2:** Modify the `createJob` and `updateJob` API logic to generate and save the `locationSlug` when a job is created or updated via the admin panel.

*   **2.3: Backfill Existing Data**
    *   `[ ]` **2.3.1:** Create a one-time backfill script (`scripts/backfill-location-slugs.ts`).
    *   `[ ]` **2.3.2:** The script will iterate through all documents in the `jobs` collection, generate a `locationSlug` from the existing `location` field, and update the document.

*   **2.4: Update Page & Component Logic**
    *   `[ ]` **2.4.1:** Update the pSEO page (`src/pages/jobs/[...slug].tsx`) to query Firestore using the `locationSlug` field when the URL dimension is `location`.
    *   `[ ]` **2.4.2:** Update any components that generate links to location pages (e.g., `RelatedSearches.tsx`) to use the `locationSlug` for the URL.

### **Phase 3 (Revised): Background Task Architecture**

**Goal:** Implement a robust background job system to handle long-running pipeline tasks triggered from the admin panel, avoiding serverless function timeouts.

*   **3.1: Create Firestore Task Queue**
    *   `[ ]` **3.1.1:** Define the data structure for a new `pipeline_tasks` collection in Firestore. Documents should include fields for `taskName`, `status` (`pending`, `in_progress`, `success`, `error`), `createdAt`, `completedAt`, and `logs`.

*   **3.2: Develop the Worker Process**
    *   `[ ]` **3.2.1:** Create a new long-running Node.js script (`scripts/worker.ts`).
    *   `[ ]` **3.2.2:** This worker will listen to the `pipeline_tasks` collection for new documents.
    *   `[ ]` **3.2.3:** When a new task is detected, the worker will execute the appropriate `npm run ...` command (e.g., `npm run enrich:jobs`) using Node.js's `child_process`.
    *   `[ ]` **3.2.4:** The worker will update the task's document in Firestore with the real-time output (logs) and final status (`success`/`error`) of the script.

### **Phase 4: Pipeline Orchestration & Control**

**Goal:** Formalize the sequential pipeline workflow and provide administrators with granular, on-demand control over its execution from the admin panel, leveraging the new background task architecture.

*   **4.1: Create Master Pipeline Orchestration Script**
    *   `[ ]` **4.1.1:** Create a new master script (`scripts/run-full-pipeline.ts`) that executes the individual pipeline stages (`fetch`, `repair`, `enrich`, `publish`) in the correct sequence.
    *   `[ ]` **4.1.2:** The script will accept arguments to run the full sequence or only a specific stage.
    *   `[ ]` **4.1.3:** Add a new `npm run pipeline:full` command to `package.json`.

*   **4.2: Build Pipeline Control UI in Admin Panel**
    *   `[ ]` **4.2.1:** On the `pipeline-status.tsx` page, add UI buttons to trigger various pipeline jobs (e.g., "Run Full Jobs Pipeline," "Run Repair Step Only").
    *   `[ ]` **4.2.2:** These buttons will call new, secure API endpoints (e.g., `/api/admin/pipeline/trigger`).
    *   `[ ]` **4.2.3:** The API endpoints will **not** run the scripts directly. Instead, they will create a new task document in the `pipeline_tasks` collection (from Phase 3), which the worker will then pick up.

*   **4.3: Implement Item-Level Pipeline Controls**
    *   `[ ]` **4.3.1:** On the "Edit Job" page, add a new "Pipeline Actions" section with buttons like "Re-Enrich this Job."
    *   `[ ]` **4.3.2:** These buttons will call new API endpoints that create tasks in the `pipeline_tasks` collection with specific parameters (e.g., `taskName: 'enrich-single-job'`, `jobId: '...'`).
    *   `[ ]` **4.3.3:** The worker script will be updated to handle these new task types.

### **Phase 5: Analytics & Monitoring**

**Goal:** Implement analytics to track the performance of the pSEO strategy and overall site traffic.

*   **5.1: Integrate Google Analytics**
    *   `[ ]` **5.1.1:** Create a new `Analytics.tsx` component to house the `gtag.js` tracking code and handle Next.js route changes.
    *   `[ ]` **5.1.2:** Add the component to the main `_app.tsx` file.

*   **5.2: Document Monitoring Strategy**
    *   `[ ]` **5.2.1:** Create a `docs/MONITORING_GUIDE.md` file outlining what to monitor in Google Search Console and Google Analytics.

### **Phase 6: General UI/UX Polish (Lower Priority)**

**Goal:** Implement the remaining "nice-to-have" features from the admin review to further improve the administrator experience.

*   **6.1: Enhance Admin Lists**
    *   `[ ]` **6.1.1:** Modify the `useAdminResourceList` hook and corresponding APIs to support sorting by clicking on table headers.
    *   `[ ]` **6.1.2:** Add a dropdown to filter by `status` on the `jobs.tsx` page.

*   **6.2: Improve Form UX**
    *   `[ ]` **6.2.1:** Replace the comma-separated "Tags" text fields with a more user-friendly tag-input component.
    *   `[ ]` **6.2.2 (Stretch Goal):** Investigate and implement an auto-save-to-`localStorage` feature for the long job and article forms.