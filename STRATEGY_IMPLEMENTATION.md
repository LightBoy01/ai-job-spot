# Strategy Implementation Plan

This document outlines the strategic development phases for enhancing the AI Job Spot platform.

## Phase 1: "Day in the Life" Job Profile

- **Status:** Completed
- **Goal:** Immediately fix content display bugs and implement a high-impact, unique job detail page design.
- **Action:** Refactored `src/pages/jobs/[id].tsx` to feature the "Human Context" Q&A content prominently. Designed a fallback for jobs without this content.

## Phase 2: "Intelligent Sidebar"

- **Status:** Completed
- **Goal:** Increase site engagement and cross-pollination between articles and job listings.
- **Action:** Update `getStaticProps` and layout components for job and article detail pages to fetch and display contextually relevant links in the sidebar (e.g., show relevant jobs on an article page and vice-versa).
- **Implementation Details:** Implemented `calculateRelationships` in `seedFirestore.ts` to pre-compute related content during the build/seed process, ensuring zero runtime performance penalty.

## Phase 3: "Thematic Hubs"

- **Status:** Completed
- **Goal:** Boost SEO and establish the site as an authoritative resource for specific AI topics.
- **Action:** Create a new dynamic route (`src/pages/tags/[tag].tsx`) that generates "hub" pages for important tags. Each hub will aggregate all jobs and articles associated with that specific tag.

## Phase 4: "The Trust Layer" (Provenance & Verification)

- **Status:** Pending
- **Goal:** Become the "Blue Checkmark" for AI Jobs. In a world of AI spam, provenance is your product.
- **Action 1 (Schema):** Update the data model to track a history of verification events (`verificationHistory` array) rather than just a single date.
- **Action 2 (Features):** Implement a "Report Closed Job" feature for crowd-sourced verification.
- **Action 3 (Automation):** (Future) Build a rate-limited auditor script to check external links.