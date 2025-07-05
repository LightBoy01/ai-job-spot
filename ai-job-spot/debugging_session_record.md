# Debugging Session Record: AI Job Spot Project

This document chronicles the setup, deployment attempts, and debugging process for the 'ai-job-spot' Next.js project, from its initial state to the current unresolved build issue.

## Project Overview
*   **Project Name:** AI Job Spot
*   **Framework:** Next.js (App Router)
*   **Database:** Firebase Firestore
*   **Styling:** Tailwind CSS
*   **Deployment Target:** Vercel
*   **Development Environment:** Termux on Android

## 1. Project Initialization & Initial Local Testing

The project was scaffolded and core components (`Navbar`, `Layout`, `JobCard`, `AdContainer`) were confirmed to be in place.

**Initial Local Test (`npm run dev`):**
*   **Result:** Server started successfully, but errors were observed in the console related to dynamic routes (`/articles/[slug]` and `/jobs/[id]`).
*   **Error:** `params` should be awaited before using its properties.
*   **Fix:** Modified `src/app/articles/[slug]/page.tsx` and `src/app/jobs/[id]/page.tsx` to `await params` (later found to be incorrect for App Router).

## 2. Git Repository Setup

*   **Action:** Initialized Git repository in `/data/data/com.termux/files/home/ai-job-spot`.
    ```bash
    git init
    ```
*   **Action:** Configured global Git user identity.
    ```bash
    git config --global user.email "mikailnururrahmon@gmail.com"
    git config --global user.name "LightBoy01"
    ```
*   **Action:** Confirmed `.gitignore` was correctly excluding sensitive files (`.env.local`, `node_modules`, `.next`, `serviceAccountKey.json`).
*   **Action:** Added all tracked files and made initial commit.
    ```bash
    git add .
    git commit -m "feat: Initial project setup and core components"
    ```
*   **Action:** Added GitHub remote origin.
    ```bash
    git remote add origin https://github.com/LightBoy01/ai-job-spot.git
    ```
*   **Action:** Pushed to GitHub using Personal Access Token (PAT) due to Termux non-interactive environment.
    ```bash
    git remote set-url origin https://LightBoy01:YOUR_PAT@github.com/LightBoy01/ai-job-spot.git
    git push -u origin master
    git remote set-url origin https://github.com/LightBoy01/ai-job-spot.git # Reverted for security
    ```

## 3. Vercel CLI Setup & Environment Variables

*   **Action:** Installed Vercel CLI globally.
    ```bash
    npm install -g vercel
    ```
*   **Action:** Logged in to Vercel via CLI (using GitHub authentication).
    ```bash
    vercel login
    ```
*   **Action:** Linked local project to Vercel project.
    ```bash
    vercel link --yes
    ```
*   **Action:** Added Firebase environment variables to Vercel project (production, preview, development scopes) using `vercel env add`.
    ```bash
    echo "AIzaSyD2uGx4BjrXszfsqStj0PCiqjkjIALN0k4" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
    # ... (repeated for all Firebase keys and scopes)
    ```

## 4. Deployment Issues & Debugging

### Issue 1: `npm install` failed with `EBADPLATFORM`

*   **Error Log:**
    ```
    npm error notsup Unsupported platform for lightningcss.android-arm64.node@1.29.3-1: wanted {"os":"android","cpu":"arm64"} (current: {"os":"linux","cpu":"x64"})
    ```
*   **Diagnosis:** `lightningcss.android-arm64.node` (a dev dependency) was specific to Termux (Android ARM64) and incompatible with Vercel's Linux environment. `package-lock.json` was locking in this platform-specific binary.
*   **Fix Attempts:**
    1.  Regenerated `package-lock.json` locally (`rm -rf node_modules package-lock.json && npm install`).
    2.  Changed Vercel's "Install Command" to `npm install --no-save` and overrode it.
    3.  **Successful Fix:** Removed `lightningcss.android-arm64.node` from `package.json` and removed `package-lock.json` from the repository.
        ```bash
        rm package-lock.json
        git add package.json && git commit -m "fix: Remove platform-specific lightningcss dependency"
        # ... (push to GitHub)
        ```

### Issue 2: `npm run build` failed with Linting/Type Errors

*   **Error Log (after `npm install` succeeded):**
    ```
    ./src/app/articles/[slug]/page.tsx
    94:12  Error: 'Link' is not defined.  react/jsx-no-undef
    ./src/components/Adsense.tsx
    27:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
    ```
*   **Diagnosis:** Missing `Link` import and `any` type usage.
*   **Fixes:**
    1.  Added `import Link from 'next/link';` to `src/app/articles/[slug]/page.tsx`.
    2.  Augmented `Window` interface in `src/components/Adsense.tsx` to remove `any` casts.
    ```bash
    git add src/app/articles/[slug]/page.tsx src/components/Adsense.tsx
    git commit -m "fix: Resolve linting and type errors in articles page and Adsense component"
    # ... (push to GitHub)
    ```

### Issue 3: Persistent `npm run build` Type Error (`PageProps` constraint)

*   **Error Log (most recent):**
    ```
    src/app/articles/[slug]/page.tsx
    Type error: Type '{ params: { slug: string; }; searchParams?: { [key: string]: string | string[] | undefined; } | undefined; }' does not satisfy the constraint 'PageProps'.
      Types of property 'params' are incompatible.
        Type '{ slug: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
    ```
*   **Diagnosis:** This is a known, misleading TypeScript error in Next.js App Router, often related to `generateMetadata` and `PageProps` typing.
*   **Fix Attempts:**
    1.  Initial incorrect fix: `await params` in page components (reverted).
    2.  Explicitly added `searchParams` to `ArticleDetailsPageProps` and `JobDetailsPageProps`.
    3.  Explicitly typed `params` and `searchParams` inline in `generateMetadata` and page component.
    4.  Attempted to remove `ArticleDetailsPageProps` interface entirely and directly type inline (failed due to `replace` tool error).
    5.  Attempted to explicitly cast `params` within `generateMetadata` and the page component (failed due to `replace` tool error).
    6.  **Current State:** The error persists. The last action was to attempt to explicitly cast `params` within `generateMetadata` and the page component.

## Current Status

The project is currently facing a persistent TypeScript type error during the `npm run build` process, specifically in `src/app/articles/[slug]/page.tsx`. This error is preventing successful deployment to Vercel.

We have systematically addressed all previous build issues, and the current error is the sole remaining blocker.

---
**End of Record**
