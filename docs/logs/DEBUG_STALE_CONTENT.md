## Note on Resolving Stale Content Issues

**Problem Description:**
Stale content issues manifest when changes made to the codebase or data are not reflected on the live website, despite successful deployments. This often points to caching problems at various layers or incorrect data fetching/rendering logic.

**Diagnosis & Resolution Playbook:**

1.  **Verify the Problem:**
    *   Confirm the specific URL(s) exhibiting stale content.
    *   Check in incognito mode or after clearing browser cache to rule out client-side caching.
    *   Compare the expected content (from code/database) with the actual content served on the live site (e.g., using browser developer tools to inspect HTML source).

2.  **Identify the Last Relevant Code Change:**
    *   Use `git log` to identify the commit(s) where the content was supposed to be updated. This helps narrow down the scope of investigation.

3.  **Audit the Data Source (Markdown/CMS/Database):**
    *   **For Markdown/Local Files:** Verify that the source files (e.g., `.md` files for jobs/articles) contain the correct, updated content.
    *   **For Databases (e.g., Firestore):**
        *   Check the database directly (e.g., Firebase Console) to confirm that the data is correctly stored and reflects the latest changes.
        *   If a seeding script is used (`seedFirestore.ts`), ensure it ran successfully and correctly pushed the updated data to the database.

4.  **Examine Data Fetching Logic (`getStaticProps`, `getServerSideProps`, API Routes):**
    *   **`getStaticProps` / `getStaticPaths` (Next.js SSG):**
        *   **Revalidation:** Check the `revalidate` property. If it's missing or set to a very high value, the page might not be regenerating frequently enough.
        *   **Data Fetching Function:** Trace the data fetching function (e.g., `getJobById`, `getArticleBySlug`) to ensure it's correctly querying the database and retrieving all necessary fields.
        *   **Serialization:** Verify that data fetched from the backend (e.g., Firestore `Timestamp` objects) is correctly serialized into a format that can be passed as props (e.g., `toISOString()` for Dates).
    *   **`getServerSideProps` (Next.js SSR):**
        *   Ensure the data fetching logic is executed on every request (or as per caching headers).
    *   **API Routes:** If data is fetched via client-side API calls, inspect the API route's logic to ensure it's returning the latest data.

5.  **Review Data Processing/Mapping Functions:**
    *   Functions that process raw data from the database into frontend-consumable objects (e.g., `processJobData`, `processArticleData`) are critical. Ensure all expected fields are explicitly mapped and not accidentally omitted.

6.  **Check Component Rendering Logic:**
    *   Verify that the frontend component (e.g., `JobDetails`, `ArticlePage`) is conditionally rendering or displaying all the fields that are passed to it as props. Look for `if (data.field != null)` conditions that might be preventing rendering.

7.  **Vercel/Deployment-Specific Caching:**
    *   **Redeploy:** A manual redeployment on Vercel can often clear Vercel's CDN cache.
    *   **Build Logs:** Review Vercel build logs for any warnings or errors related to data fetching, static page generation, or caching.
    *   **Environment Variables:** Ensure all necessary environment variables (e.g., `NEXT_PUBLIC_SITE_URL`, Firebase credentials) are correctly configured in the Vercel project settings and are available during the build process.

8.  **Firebase Indexing (for Firestore queries):**
    *   If new queries or complex `where` and `orderBy` clauses are introduced, they might require new composite indexes in Firestore. The Firebase console or build logs will usually provide a direct link to create these.
    *   Ensure `firestore.indexes.json` is updated and deployed (`firebase deploy --only firestore:indexes`).

9.  **Browser/CDN Caching:**
    *   Instruct the user to perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) or clear their browser cache.
    *   If a CDN is in use, check its caching policies and consider purging the cache.

**General Approach:**

*   **Systematic Elimination:** Start from the source (data) and move towards the display (frontend), eliminating potential points of failure at each step.
*   **Small, Incremental Changes:** When applying fixes, make small, isolated changes and verify each one to avoid introducing new issues.
*   **Clear Communication:** Keep the user informed about the diagnostic steps and proposed solutions.

This comprehensive approach will help in efficiently pinpointing and resolving stale content issues in the future.
