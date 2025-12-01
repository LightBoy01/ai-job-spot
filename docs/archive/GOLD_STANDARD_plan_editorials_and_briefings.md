# Project Plan v4.1: "Editorials & Briefings" (Gold Standard - Fortified)

**Objective:** To evolve the articles section into a sophisticated content platform that clearly distinguishes between original analysis ("Editorials") and curated external content ("Briefings"), enhancing user experience, brand authority, and SEO, while ensuring the system is testable, maintainable, and well-documented.

**Status:** Not Started

---

### **Phase 0: Pre-flight & Safety**
*(Goal: Ensure a safe and reversible development process.)*

*   **Task 0.1:** Create a dedicated Git feature branch.
    *   **Command:** `git checkout -b feature/editorials-briefings`
    *   **Verification:** `git branch` shows the new branch is active.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 0.2:** Define and document the database rollback procedure.
    *   **Details:** Document the exact shell commands and steps required to restore the Firestore database from the most recent backup.
    *   **Key Files:** `docs/EMERGENCY_ROLLBACK.md` (New File)
    *   **Verification:** The rollback document is created and peer-reviewed.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 0.3:** **(New)** Perform a dry-run database restore.
    *   **Details:** Restore the latest backup to a *separate, temporary* Firestore project or emulator to confirm the integrity of the backup files and the restore process.
    *   **Verification:** The temporary database is successfully populated from the backup.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 1: Foundational Rework & Data Integrity**
*(Goal: Update the entire system to handle the new content types.)*

*   **Task 1.0: (Fortified)** Define and document a Unified ID Generation Strategy.
    *   **Details:** Document a clear, prefixed ID strategy for all content types (e.g., `editorial-<slug>`, `briefing-<hash>`, `job-<hash>`) to prevent ID collisions.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.1 - 1.3:** Update types, schemas, and admin forms.
    *   **Details:** Includes adding `contentType`, `sourceName`, `originalUrl`. **(Fortified)** The Zod schema for Briefings must enforce that `originalUrl` is a required and valid URL.
    *   **Status:** `[ ]`

*   **Task 1.4:** Create and test a backfill script.
    *   **Details:** Write a one-time script to add `contentType: 'editorial'` to all existing articles. **The script must be idempotent**.
    *   **Key Files:** `scripts/backfill-content-type.ts` (New File)
    *   **Verification:** Run the script on a backup of the content files and verify the changes.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.5:** Execute seeding script.
    *   **Details:** **(Fortified)** The seed script must be modified to skip any Briefing that is missing a valid `originalUrl`, logging an error instead.
    *   **Status:** `[ ]`

---

### **Phase 2: UI/UX Implementation**
*(Goal: Build the user-facing features based on the new data model.)*

*   **Task 2.1:** Implement filter logic on the main articles page.
    *   **Details:** Add filter toggles. **Security Note:** The backend API handling the filter must use a strict allow-list for the query parameter.
    *   **Key Files:** `src/pages/articles.tsx`, `src/pages/api/articles/search.ts`
    *   **Verification:** Manually test filters. Test the API with invalid filter values.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 2.2 - 2.4:** Implement `ArticleCard` variants, attribution block, and canonical URL logic.
    *   **Status:** `[ ]`

*   **Task 2.5:** Add user-facing explanations.
    *   **Details:** Add a tooltip or info icon to the UI that clearly explains the difference between "Editorials" and "Briefings".
    *   **Key Files:** `src/pages/articles.tsx`, `src/components/ArticleCard.tsx`
    *   **Verification:** The tooltips are visible and clear on the development server.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 3: Pipeline Expansion for "Briefings"**
*(Goal: Begin automatically ingesting curated content safely using a file-centric approach.)*

*   **Task 3.0: (Fortified)** Decide on the persistence strategy for Briefing markdown files.
    *   **Details:** Choose between committing files to Git or treating them as transient build artifacts (recommended). This will inform the pipeline's output directory (`.gitignore`).
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 3.1: (Fortified)** Design & Implement Generic Article Pipeline.
    *   **Details:** Use the logic from `run_aggregation.ts` as a template but adapt it to the file-centric `data-pipeline` model. The pipeline must be **stateful**, performing a "diff" against the source to detect and archive stale content. **Security Critical:** All automatically ingested "Briefings" **must** be written as markdown files with `status: 'pending_review'` in the frontmatter.
    *   **Verification:** A new article from the pipeline is created as a `.md` file and is not yet visible on the public site.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 3.2:** Implement First RSS Source.
    *   **Details:** To de-risk the SEO strategy, start with a maximum of **3-5 high-authority, reputable sources.**
    *   **Key Files:** `src/data-pipeline/sources/new-rss-source.ts`
    *   **Verification:** Content from the new source is correctly ingested as markdown files awaiting review.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 4: Testing & Security**
*(Goal: Ensure the new features are robust and secure before launch.)*

*   (No change) Tasks for writing tests and conducting a security review.
    *   **Status:** `[ ]`

---

### **Phase 5: Documentation & Finalization**
*(Goal: Ensure the new system is understandable and maintainable.)*

*   (No change) Tasks for updating documentation and merging the feature branch.
    *   **Status:** `[ ]`

---

### **Phase 6: Post-Launch Monitoring**
*(Goal: Measure the impact and success of the new feature.)*

*   (No change) Tasks for setting up analytics and monitoring SEO performance.
    *   **Status:** `[ ]`
