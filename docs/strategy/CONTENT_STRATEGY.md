# Content Strategy & Workflows

This document outlines the content strategy for AI Job Spot, focusing on the different types of content and the technical workflows that support them.

---

## 1. Content Types

The site features two primary types of article content, distinguished by the `contentType` field:

### a. Editorials (`contentType: 'editorial'`)

*   **Definition:** Original, long-form articles, opinion pieces, and analyses created by AI Job Spot authors.
*   **Source of Truth:** Manually created Markdown files located in the `src/articles/` directory.
*   **Workflow:**
    1.  An author writes a new article as a `.md` file.
    2.  The file is added to the `src/articles/` directory and committed to Git.
    3.  Running `npm run seed` will add the new article to the Firestore database and make it live.

### b. Briefings (`contentType: 'briefing'`)

*   **Definition:** Curated summaries of interesting, high-quality articles from external, reputable sources. They are designed to provide quick insights while driving traffic to the original author.
*   **Source of Truth:** The original article on the external website. The local files are transient artifacts.
*   **Workflow:**
    1.  **Ingestion:** The automated `ingest-briefings.ts` pipeline runs on a schedule.
    2.  It reads from the `sources` collection in Firestore to find active RSS feeds.
    3.  It fetches the feeds, parses the items, and creates new Markdown files in the `src/content/briefings/` directory (which is ignored by Git).
    4.  **Crucially, all new briefings are created with `status: 'pending_review'` in their frontmatter.**
    5.  **Seeding:** The `npm run seed` script processes these transient files and adds them to the `articles` collection in Firestore with the `pending_review` status.
    6.  **Admin Review:** An administrator must go to the "Reviews" section of the Admin Panel, view the new briefing, and manually approve it to publish it to the live site.

---

## 2. Technical Implementation

### The Ingestion Pipeline (`scripts/ingest-briefings.ts`)

*   This script is responsible for the automated collection of Briefings.
*   It is **database-driven**, configured by the documents in the `sources` collection.
*   It is **stateful**, tracking when it last fetched a source (`lastFetchedAt`) and respecting the `fetchFrequency` (e.g., 'daily').
*   It is **idempotent**, meaning it will not create duplicate files for the same article on subsequent runs.
*   It **archives stale content**: If an article is removed from an RSS feed, the pipeline will detect this and move the corresponding local file to the `/archive` directory.

### The Seed Script (`seedFirestore.ts`)

*   This is the master script for synchronizing all local content (Editorials, Briefings, Jobs, and Sources config) with the Firestore database.
*   It is the core of the site's "Git as Backup" restore strategy.
*   Running `npm run seed` will always bring the Firestore database up to date with the content present in the local files.
