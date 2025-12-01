# Project Plan v3: "Editorials & Briefings" Content Strategy

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

---

### **Phase 1: Foundational Rework & Data Integrity**
*(Goal: Update the entire system to handle the new content types.)*

*   **Task 1.1:** Update core application types.
    *   **Details:** Add `contentType: 'editorial' | 'briefing'`, `sourceName?: string | null`, and `originalUrl?: string | null` to the `Article` and related `Serialized` interfaces.
    *   **Key Files:** `src/lib/types.ts`
    *   **Verification:** `npm run build` compiles without type errors related to these changes.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.2:** Update Zod validation schemas.
    *   **Details:** Add the new `contentType`, `sourceName`, and `originalUrl` fields to the `ArticleSchema`.
    *   **Key Files:** `src/lib/validationSchemas.ts`
    *   **Verification:** `npm run test` passes, especially tests related to article creation/validation.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.3:** Update Admin Panel forms.
    *   **Details:** Add a "Content Type" selector and fields for "Source Name" and "Original URL" to the article creation and editing forms.
    *   **Key Files:** `src/pages/admin/articles/new.tsx`, `src/pages/admin/articles/edit/[slug].tsx`
    *   **Verification:** The new form fields render correctly in the admin panel.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.4:** Create and test a backfill script.
    *   **Details:** Write a one-time script to add `contentType: 'editorial'` to the frontmatter of all existing Markdown files in `src/articles`.
    *   **Key Files:** `scripts/backfill-content-type.ts` (New File)
    *   **Verification:** Run the script on a backup of the content files and verify the changes are applied correctly.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 1.5:** Execute seeding script.
    *   **Details:** Run the main seeding script to update all Firestore documents with the new fields.
    *   **Command:** `npm run seed`
    *   **Verification:** Check Firestore console to confirm `contentType` field exists on article documents.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 2: UI/UX Implementation**
*(Goal: Build the user-facing features based on the new data model.)*

*   **Task 2.1:** Implement filter logic on the main articles page.
    *   **Details:** Add `[ All ]`, `[ Editorials ]`, `[ Briefings ]` filter toggles that use URL query parameters to control the displayed content.
    *   **Key Files:** `src/pages/articles.tsx`
    *   **Verification:** Manually test the filters on the live development server.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 2.2:** Implement `ArticleCard` variants.
    *   **Details:** Modify the component to render distinct visual styles (e.g., a "Briefing" badge or different border color) based on the `contentType` prop.
    *   **Key Files:** `src/components/ArticleCard.tsx`
    *   **Verification:** Create a Storybook or a test page to view both component variants.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 2.3:** Implement attribution block on article detail pages.
    *   **Details:** For "Briefing" content, conditionally render a block that displays the `sourceName` and links to the `originalUrl`.
    *   **Key Files:** `src/pages/articles/[slug].tsx`
    *   **Verification:** Manually view a "Briefing" article and confirm the attribution block appears and links correctly.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 2.4:** Implement conditional canonical URL logic.
    *   **Details:** In the `<Head>` component of the article detail page, if `contentType` is "Briefing", set the `rel="canonical"` link tag to the `originalUrl`.
    *   **Key Files:** `src/pages/articles/[slug].tsx`
    *   **Verification:** Inspect the `<head>` of a rendered "Briefing" page to confirm the canonical URL is correct.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 3: Security & Testing**
*(Goal: Ensure the new features are robust, secure, and well-tested.)*

*   **Task 3.1:** Write unit and integration tests.
    *   **Details:** Write tests for the new UI components, the filter logic, and the conditional rendering of the attribution block.
    *   **Key Files:** `__tests__/pages/articles.test.tsx`, `__tests__/components/ArticleCard.test.tsx`
    *   **Verification:** `npm run test` passes with increased coverage.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 3.2:** Conduct a security review.
    *   **Details:** Review the new filter logic to ensure the URL query parameters are handled safely and cannot be exploited.
    *   **Verification:** Manual review and testing of malicious or unexpected query parameters.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 4: Documentation & Finalization**
*(Goal: Ensure the new system is understandable and maintainable.)*

*   **Task 4.1:** Update project documentation.
    *   **Details:** Create or update a document that explains the new content strategy, the purpose of the `contentType` field, and the process for adding new content.
    *   **Key Files:** `docs/CONTENT_STRATEGY.md` (New File)
    *   **Verification:** The document is created and is clear and comprehensive.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 4.2:** Merge feature branch to main.
    *   **Command:** `git checkout main && git merge feature/editorials-briefings`
    *   **Verification:** The main branch is up-to-date.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

---

### **Phase 5: Post-Launch Monitoring**
*(Goal: Measure the impact and success of the new feature.)*

*   **Task 5.1:** Set up analytics tracking.
    *   **Details:** Create goals or events in your analytics platform (e.g., Google Analytics) to track user clicks on the "Editorials" and "Briefings" filters.
    *   **Verification:** Analytics events are firing correctly.
    *   **Owner:** Dev
    *   **Status:** `[ ]`

*   **Task 5.2:** Monitor SEO performance.
    *   **Details:** In Google Search Console, monitor the indexing status of "Briefing" pages to ensure they are being handled correctly with the new canonical tags.
    *   **Verification:** Review GSC reports after 1-2 weeks.
    *   **Owner:** Dev
    *   **Status:** `[ ]`
