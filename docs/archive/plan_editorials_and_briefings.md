### Project Plan v2: The "Editorials & Briefings" Content Strategy

**Objective:** To evolve the articles section into a more sophisticated content platform that clearly distinguishes between original analysis ("Editorials") and curated external content ("Briefings"), enhancing user experience, brand authority, and SEO, while ensuring the system is testable, maintainable, and well-documented.

---

#### **Phase 1: Foundational Rework & Data Integrity**
*(Goal: Update the entire system to handle the new content types and ensure all changes are safe and testable.)*

*   `[x]` **1.1: Update Core Application Types (`src/lib/types.ts`)**
    *   **Task:** Add `contentType: 'editorial' | 'briefing'`, `sourceName?: string`, and `originalUrl?: string` to the `Article` and `SerializedArticle` interfaces.

*   `[x]` **1.2: Update Seeding Script Schema (`seedFirestore.ts`)**
    *   **Task:** Add the same new fields to the Zod `articleSchema`.

*   `[x]` **1.3: Update Admin Panel Forms (`src/pages/admin/articles/...`)**
    *   **Task:** Add a "Content Type" selector (e.g., a dropdown) to the "Add New Article" and "Edit Article" forms so that content can be manually classified.

*   `[x]` **1.4: Create & Test Backfill Script**
    *   **Task:** Write and test a one-time script to programmatically add `contentType: 'editorial'` to the frontmatter of all existing Markdown files in the `src/articles` directory.

*   `[x]` **1.5: Verify Backup & Run Seed Script**
    *   **Task:** First, confirm that the database backup mechanism is working. Then, execute `npm run seed` to update all live article documents with the new `contentType` field.
    *   **Purpose:** This is a safety-critical step to ensure data integrity.

*   `[x]` **1.6: Write Foundational Tests**
    *   **Task:** Add unit tests for the new logic, such as ensuring the seeder correctly processes the `contentType` field.

---

#### **Phase 2: UI/UX Implementation & Testing**
*(Goal: To build the user-facing features based on the new data model.)*

*   `[ ]` **2.1: Implement Filter Logic & Tests (`src/pages/articles.tsx`)**
    *   **Task:** Implement the `[ All ]`, `[ Editorials ]`, `[ Briefings ]` filter toggles using URL query parameters. Write tests to verify the filtering works correctly.

*   `[ ]` **2.2: Implement `ArticleCard` Variants & Tests (`src/components/ArticleCard.tsx`)**
    *   **Task:** Modify the component to render distinct visual styles for "Editorial" and "Briefing" content types. Write unit tests to confirm the correct style is rendered based on the `contentType` prop.

*   `[ ]` **2.3: Implement Attribution Block (`src/pages/articles/[slug].tsx`)**
    *   **Task:** Add the conditionally rendered block for "Briefings" that links to the original source.

*   `[ ]` **2.4: Implement Canonical URL Logic (`src/pages/articles/[slug].tsx`)**
    *   **Task:** Update the `<Head>` component to conditionally set the `rel="canonical"` link tag based on `contentType`.

---

#### **Phase 3: Documentation & Finalization**
*(Goal: To ensure the new system is understandable and maintainable for the future.)*

*   `[ ]` **3.1: Update Project Documentation**
    *   **Task:** Create or update a document (e.g., in a `docs/` folder or the main `README.md`) that explains the new content strategy, the purpose of the `contentType` field, and the process for adding new content.

---

#### **Phase 4: Pipeline Expansion (Future Growth)**
*(Goal: To begin automatically ingesting "Curated Briefings.")*

*   `[ ]` **4.1: Design & Implement Generic Article Pipeline**
*   `[ ]` **4.2: Implement First RSS Source**
