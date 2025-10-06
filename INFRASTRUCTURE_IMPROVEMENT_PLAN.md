# Infrastructure Improvement Plan

This document tracks the progress of enhancing the AI Job Spot content infrastructure, incorporating findings from our Red Team analysis to ensure security, scalability, and maintainability.

## Phase 1: Consolidate and Unify the Foundation
*Goal: Reduce redundancy, improve maintainability, and make the system easier to extend.*

- [x] **1.1: Create Central Content Model Config**
  - [x] Create a new configuration file at `src/config/content-model.ts`.
  - [x] In this file, define a `CONTENT_MODEL` object.
  - [x] Add entries for `jobs`, `articles`, and `briefings`. Each entry should specify its `path`, `idField`, and applicable `operations`.

- [x] **1.2: Refactor Core Scripts to be Config-Driven**
  - [x] Modify `seedFirestore.ts` to import and loop through the `CONTENT_MODEL` config, making it content-type agnostic.
  - [x] Create `enrich_briefings.ts` by cloning and adapting `enrich_jobs.ts` with a new AI prompt tailored for briefings.
  - [x] Refactor `content-hygiene.ts` to be config-driven, applying sanitization to all relevant types and job-specific archival logic only to jobs.

- [x] **1.3: Create Master `ops.ts` CLI Tool**
  - [x] Create a master script `ops.ts` in the `scripts` directory to act as a single entry point for all backend content operations.
  - [x] Implement argument parsing (using `minimist`) to handle commands like `--run=hygiene` or `--run=enrich --type=briefings`.
  - [x] Simplify `package.json` scripts to call `ops.ts` with the appropriate arguments.

## Phase 2: Implement a Robust Asynchronous Job System
*Goal: Securely trigger long-running tasks from the Admin Panel via a scalable, timeout-proof architecture.*

- [x] **2.1: Set up Firestore Job Queue**
  - [x] In the Firestore database, design and document a new root collection named `system_jobs`.
  - [x] Define the schema for a job document within this collection.

- [x] **2.2: Create the Secure API Endpoint for Scheduling Jobs**
  - [x] Create a new API route at `POST /api/admin/ops/trigger`.
  - [x] **Security:** Endpoint is protected by admin authentication middleware.
  - [x] Logic accepts a predefined `taskName` and validates it against a hardcoded allow-list.
  - [x] The endpoint creates a new document in the `system_jobs` collection with `status: 'pending'` and responds immediately.

- [x] **2.3: Create the Cron Job Worker**
  - [x] Create a new script, `scripts/system-job-worker.ts`.
  - [x] The script queries `system_jobs` for a pending job, locks it, and executes the appropriate `ops.ts` command.
  - [x] It captures `stdout`/`stderr` and saves it to the job document's `logs` field in Firestore.
  - [x] It updates the job status to `completed` or `failed` upon completion.
  - [x] A `vercel.json` file is configured to run this worker script via an API wrapper every minute.

- [x] **2.4: Build the Admin UI for the Job System**
  - [x] Overhaul the `pipeline-status.tsx` page to connect to the `system_jobs` collection in real-time.
  - [x] The UI now displays a table of all system jobs, their status, and a button to view logs.
  - [x] Buttons have been added to the main Admin Dashboard to call the `/api/admin/ops/trigger` endpoint to schedule jobs.

## Phase 3: AI-Powered Curation & Immediate Fixes
*Goal: Use AI to accelerate the manual review process and implement immediate resilience improvements.*

- [x] **3.1: Implement "AI Sanity Check" in Review UI**
  - [x] Create a new API route (`/api/admin/ai/sanity-check`) that sends content to a generative AI with a "review" prompt.
  - [x] In the `reviews.tsx` page, add an "AI Sanity Check" button to each item.
  - [x] The button calls the API and displays the AI's feedback (quality score, pros, cons) in a modal.
  - [x] The `reviews.tsx` page and its data-fetching logic (`getPendingContent`) have been generalized to handle all reviewable content types.

- [x] **3.2: Implement Exponential Backoff for AI Scripts**
  - [x] Add `p-retry` library to the project.
  - [x] Refactor both `enrich_jobs.ts` and `enrich_briefings.ts` to wrap their API calls in a `p-retry` block.
  - [x] The scripts now automatically retry on transient errors (e.g., HTTP 429, 5xx) with an exponentially increasing delay, removing the need for fixed `setTimeout` calls.

- [ ] **3.3: (Exploratory) AI-Generated Image Placeholders**
  - [ ] Investigate using an AI image generation API to automatically create `imageUrl` placeholders for new articles and briefings based on their title or content.

## Phase 4: Architectural Refinement - Task Decoupling
*Goal: Evolve from large batch processes to a more scalable and resilient single-task queue model for high-volume operations like content enrichment.*

- [ ] **4.1: Design a Single-Item Queue Model**
  - [ ] Design a new Firestore collection (e.g., `task_queue`) where each document represents a single, small unit of work (e.g., "enrich job XYZ").

- [ ] **4.2: Create Dispatcher Tasks**
  - [ ] The `ENRICH_JOBS` task in the `system_jobs` queue will no longer perform the enrichment itself.
  - [ ] Instead, it will become a "Dispatcher." Its script will query all jobs needing enrichment and create hundreds of individual tasks in the new `task_queue` collection.

- [ ] **4.3: Create a Dedicated Task Worker**
  - [ ] A new cron job worker (e.g., `task-worker.ts`) will run every minute.
  - [ ] Its job is to pull one single task from the `task_queue`, execute it (e.g., call the AI API for one job), and then delete the task document.
  - [ ] This creates a steady, rate-limit-friendly stream of single-item processing that is highly scalable and resilient.
