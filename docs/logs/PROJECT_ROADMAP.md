# AI Job Spot - Project Roadmap

This document serves as the single source of truth for the project's status, architectural principles, and development plan.

## 1. High-Level Goal

To create a high-quality, monetizable AI-focused job board with a robust, automated content pipeline, providing significant value to job seekers in the AI space.

## 2. Architectural Principles

- **Unified TypeScript Ecosystem:** The entire project, from the frontend to the data pipeline, will be in a single language and ecosystem (TypeScript/Node.js) to maximize code sharing, maintainability, and developer efficiency.
- **Artifact-based Enhancement Workflow:** The automated pipeline runs in a secure, isolated environment and produces scraped job postings as downloadable artifacts. This creates a "human-in-the-loop" process where raw data is manually downloaded, enhanced with high-value, non-scrapable information, and then integrated into the project.
- **Security First:** All changes will be evaluated for their security implications. This includes protecting user data, securing admin functionality, and preventing vulnerabilities.
- **Continuous Improvement ("Sharpen the Saw"):** The project will be periodically reviewed for areas of improvement, from dependency updates to architectural refactoring.

## 3. Development Roadmap

### Phase 1: Foundation & Review (Complete)

- [x] Comprehensive Project Architectural Review
- [x] Dependency Audit & Vulnerability Patching
- [x] Performance Optimization (Replacing `<img>` with `next/image`)

### Phase 2: Pipeline Refactoring (In Progress)

This phase focuses on replacing the Python/Scrapy pipeline with a more integrated Node.js/Crawlee pipeline.

- [x] **Sub-task 1: Initial Setup**
  - [x] Create `src/data-pipeline` directory.
  - [x] Add `Crawlee`, `Playwright`, and `got-scraping` as dependencies to `package.json`.
- [x] **Sub-task 2: Implement Crawler**
  - [x] Create a `main.ts` entry point for the pipeline.
  - [x] Port the core scraping logic from `configurable_spider.py` to a new `PlaywrightCrawler` managed by Crawlee.
  - [x] The crawler uses `pipeline_config.json` for its instructions.
- [x] **Sub-task 3: Implement Duplicate Check**
  - [x] Before writing a new job file, the script will check all existing `.md` files in `src/job-descriptions` and `data/pending_review` to prevent adding duplicates.
- [x] **Sub-task 4: Implement Output Generation**
  - [x] The final output of the crawler is the creation of new job Markdown files in the `data/pending_review/` directory.
- [ ] **Sub-task 5: Update GitHub Workflow**
  - [ ] Modify `.github/workflows/pipeline.yml`.
  - [ ] Replace the Python environment setup with a Node.js environment setup.
  - [ ] Change the "Run Pipeline" step to execute the new TypeScript script (`npm run pipeline:run`).
  - [ ] Ensure the workflow saves the contents of `data/pending_review` as a downloadable artifact named `scraped-jobs`.

### Phase 3: Content Enhancement & Seeding (Recurring)

This is the manual, human-in-the-loop part of the workflow.

- [ ] Download the `scraped-jobs` artifact from a completed GitHub Actions run.
- [ ] Unzip and place the new job Markdown files into the local `data/pending_review` directory.
- [ ] Enhance the files by adding high-value information (e.g., Glassdoor/Crunchbase links, application experience, etc.).
- [ ] Move the enhanced files from `data/pending_review` to `src/job-descriptions`.
- [ ] Run the `npm run seed` script to update the Firestore database.

### Phase 4: Future Enhancements (Backlog)

These are planned tasks to be addressed after the pipeline refactoring is complete.

- [ ] **Implement Contact Form Backend:** Create a Next.js API route to handle submissions from the contact page and send an email notification.
- [ ] **Refine Admin Panel UI/UX:** Improve user feedback (e.g., toast notifications, loading states) and component reusability in the admin section.
- [ ] **Explore `tRPC` for Admin APIs:** Investigate refactoring the admin panel's REST APIs to tRPC for end-to-end type safety.
- [ ] **Plan Major Dependency Upgrades:** Schedule and plan the migration to future major versions of key dependencies like React 19 and Tailwind CSS 4.