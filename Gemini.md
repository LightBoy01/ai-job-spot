# Master Plan: AI Job Spot (Revised)

This document outlines the revised development and deployment plan for the 'ai-job-spot' Next.js project, focusing on resolving the current build-time error and moving forward.

**Development Environment:** Termux on Android
**Deployment Target:** Vercel via GitHub

## Current Status

The project is blocked by a persistent TypeScript type error in `src/app/articles/[slug]/page.tsx` which prevents the `npm run build` command from completing successfully. This is the sole blocker for Vercel deployment.

**Error:** `Type '{ params: { slug: string; }; ... }' does not satisfy the constraint 'PageProps'.`

## Phase 1: Resolve Build Error & Deploy

Our immediate and primary goal is to fix the TypeScript error and achieve a successful production build and deployment.

1.  **Analyze the Type Error:** The error is a known, misleading issue in the Next.js App Router related to how `PageProps` are inferred, especially when `generateMetadata` is used. The fix involves simplifying and clarifying the type definitions for the page component and its related functions.

2.  **Implement the Fix:**
    *   **Target File:** `src/app/articles/[slug]/page.tsx`
    *   **Action:** Remove the custom `ArticleDetailsPageProps` interface. Instead, we will directly and explicitly type the `params` prop for both the `generateMetadata` function and the `ArticleDetailsPage` component. This avoids the type inference conflict that is causing the build to fail.

3.  **Verify the Fix:**
    *   **Local Build:** After applying the code change, run `npm run build` locally within Termux. This is the most critical step. The build must succeed without any type errors.
    *   **Local Dev Server:** (Optional but recommended) Run `npm run dev` to ensure the page still renders correctly in a development environment.

4.  **Deploy to Vercel:**
    *   Once the local build is successful, commit the fix to Git.
        ```bash
        git add src/app/articles/[slug]/page.tsx
        git commit -m "fix(articles): Resolve TypeScript error by simplifying page props"
        git push origin main
        ```
    *   Monitor the deployment on the Vercel dashboard to ensure it completes without issues.

## Phase 2: Post-Deployment & Next Steps

Once the application is successfully deployed, the following steps will be prioritized.

1.  **Firebase Integration & Data Seeding:**
    *   Verify that the deployed application correctly connects to the Firebase Firestore instance.
    *   Run the `seedFirestore.js` script (`node seedFirestore.js`) to populate the database with initial job and article data. Confirm this data is visible on the live site.

2.  **Component & Feature Refinement:**
    *   **Job Search/Filtering:** Implement UI and logic for searching and filtering jobs by keywords, location, or type.
    *   **AdSense Integration:** Ensure the `Adsense` component is correctly configured and displaying ads in the production environment.
    *   **Responsive Design:** Conduct a thorough review of the application on various screen sizes and fix any styling or layout issues.

3.  **Code Quality & Maintenance:**
    *   **Re-introduce `package-lock.json`:** After the platform-specific dependency issue was resolved, `package-lock.json` was removed. It should be regenerated (`npm install`) and committed to the repository to ensure consistent, faster, and more secure dependency management for future deployments.
    *   **Linting and Formatting:** Enforce consistent code style by running `npm run lint` and `npx prettier --write .` regularly.

This revised plan provides a clear path to resolving the immediate blocker and advancing the project.
