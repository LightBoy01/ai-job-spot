# Code Quality Improvement Plan

This document outlines a comprehensive, phased plan for refactoring and improving the AI Job Spot codebase. The primary goals are to eliminate build errors, improve type safety, enhance security, and ensure long-term maintainability.

## Phase 1: Critical Fixes & Build Stabilization

These items are critical for a successful build and the immediate security of the application.

*   **[Critical] Fix Security Risk in `debug-revalidate-token.ts`:** Uncomment or remove the code that disables the debug endpoint in production to prevent unauthorized access.
    *   *File:* `src/pages/api/debug-revalidate-token.ts`
*   **[High] Fix `no-unsafe-*` Warnings in Data Pipeline:**
    *   Provide a type for frontmatter data in `main.ts`.
    *   Use type guards instead of `as T` casts in `main.ts`.
    *   Use Zod schemas to validate adapter configurations in `source-adapter-factory.ts`.
    *   *Files:* `src/data-pipeline/main.ts`, `src/data-pipeline/source-adapter-factory.ts`
*   **[High] Fix Prop Spreading in `FormField.tsx`:** Remove the `error` prop from `commonProps` to prevent it from being passed to the DOM element.
    *   *File:* `src/components/FormField.tsx`
*   **[High] Fix Unhandled Promises in `Navbar.tsx`:** Wrap the `logout` call in `onClick` with an arrow function and `.catch()`.
    *   *File:* `src/components/Navbar.tsx`
*   **[High] Fix Unhandled Promises in `AdminLayout.tsx`:** Add `.catch()` handlers to `logout()` and `router.push()`.
    *   *File:* `src/components/AdminLayout.tsx`
*   **[High] Fix `no-misused-promises` in Admin Pages:** Fix the `onConfirm` handler in `ConfirmationModal` usages across admin pages (`sources.tsx`, etc.).
    *   *Files:* `src/pages/admin/*.tsx`
*   **[High] Fix Accessibility Issues:** Remove nested `<a>` tags inside `Link` components.
    *   *Files:* `src/components/JobCard.tsx`, `src/components/ArticleCard.tsx`, `src/components/Breadcrumbs.tsx`, `src/components/RelatedSearches.tsx`, `src/pages/articles/[slug].tsx`, `src/pages/jobs/[...slug].tsx`
*   **[High] Delete Build Artifacts:** Delete `src/styles/main.css` and add it to `.gitignore`.
    *   *File:* `src/styles/main.css`

## Phase 2: Type Safety & Data Validation

This phase focuses on replacing `any` types and unsafe assertions with robust Zod validation.

*   **[High] Centralize Zod Schemas:** Consolidate all Zod schemas into `src/lib/schemas.ts` to avoid duplication and inconsistencies.
    *   *Files:* `src/lib/schemas.ts`, `src/lib/validationSchemas.ts`, `src/lib/validationSchemas.cts`
*   **[High] Centralize Data Processing:** Create `src/lib/dataProcessing.ts` to house unified `processJobData` and `processArticleData` functions.
    *   *Files:* `src/lib/firestoreClient.ts`, `src/lib/firestoreAdminClient.ts`, `src/pages/api/admin/articles/search.ts`, `src/pages/api/admin/jobs/search.ts`
*   **[High] Implement Frontmatter Validation:** Add Zod validation for Markdown frontmatter in the seeding script.
    *   *Files:* `seedFirestore.ts`, `src/articles/*.md`, `src/job-descriptions/*.md`
*   **[High] Refactor `index.tsx` and `articles.tsx`:** Break down these complex components and use Zod to validate data from `getInitialStateFromSession` and API responses.
    *   *Files:* `src/pages/index.tsx`, `src/pages/articles.tsx`
*   **[High] Refactor Forms:** Convert `post-a-job.tsx` and `contact.tsx` to use `react-hook-form` with Zod validation.
    *   *Files:* `src/pages/post-a-job.tsx`, `src/pages/contact.tsx`
*   **[Medium] Validate API Payloads:** Use Zod schemas in API routes like `revalidate.ts`, `ingest.ts`, and `sanity-check.ts`.
    *   *Files:* `src/pages/api/revalidate.ts`, `src/pages/api/admin/ingest.ts`, `src/pages/api/admin/ai/sanity-check.ts`
*   **[Medium] Fix `useAuth.ts` Race Condition:** Properly handle the promise from `getIdTokenResult()`.
    *   *File:* `src/hooks/useAuth.ts`

## Phase 3: Refactoring & Clean Code

This phase addresses code quality, duplication, and architectural improvements.

*   **[Medium] Secure `post-to-twitter.ts`:** Move credentials to environment variables.
    *   *File:* `src/data-pipeline/post-to-twitter.ts`
*   **[Medium] Harden Path Traversal Checks:** Review and strengthen path sanitization in the data pipeline.
    *   *Files:* `src/data-pipeline/main.ts`, `src/data-pipeline/writer.ts`, `src/data-pipeline/utils/sanitization.ts`
*   **[Medium] Refactor `rateLimit.ts`:** Replace the in-memory store with a persistent solution (Redis/Firestore).
    *   *File:* `src/lib/rateLimit.ts`
*   **[Medium] Convert JS Parsers:** Convert `base_parser.js` and `hiring_cafe_api_parser.js` to TypeScript.
    *   *Files:* `src/data-pipeline/parsers/*.js`
*   **[Medium] Align Firestore Queries:** Ensure job queries consistently use `status: 'Active'` or similar.
    *   *File:* `src/data-pipeline/pipeline.config.jobs.ts`
*   **[Low] Refactor Source Interfaces:** Consolidate `IJobSource` and `IBriefingSource`.
    *   *File:* `src/data-pipeline/types.ts`
*   **[Low] Organize `docs` Directory:** Create subdirectories and clean up outdated files.
    *   *Directory:* `docs/`

## Phase 4: Documentation & Polish

*   **[Medium] Document Content Lifecycle:** Create documentation for how content is generated, updated, and archived.
*   **[Medium] Content Style Guide:** Document standards for Markdown content.
*   **[Low] Improve JSDocs:** Update outdated JSDoc comments in components like `Layout.tsx` and `JobCard.tsx`.
*   **[Low] Delete Unused Files:** Remove `src/__init__.py` and `src/pages/about.mdx`.