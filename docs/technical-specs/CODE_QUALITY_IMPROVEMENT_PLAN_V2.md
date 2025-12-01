# Code Quality Improvement Plan (V2 - Red Teamed)

**Lead Developer:** Gemini
**Assigned To:** Junior Developer
**Date:** 2025-11-27
**Version:** 2.0

---

## 1. Overview & Goal

Our recent development push, while functionally successful, has introduced significant technical debt, resulting in a failing build and numerous code quality issues.

**The primary goal of this plan is to restore project health, ensure long-term maintainability, and re-establish a high standard of code quality.**

### **Core Directive for the Developer**

This plan is your guide, but it is not a substitute for critical thinking. **If any step is unclear, or you suspect a risk not outlined here, you must stop and ask for clarification.** Your primary objective is to make the codebase better without introducing new bugs. When in doubt, ask.

---

## 2. Phased Action Plan

Execute these phases sequentially. Do not proceed to the next phase until the current one is fully verified.

### ☑️ Phase 0: Triage & Unblock Build (Immediate Priority)

**Goal:** Get the project to a successful `npm run build`.

| Task ID | File | Line(s) | Issue | Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T0-1 | `src/pages/dashboard.tsx` | 172 | `react/no-unescaped-entities` | Replace the unescaped apostrophe with `&apos;`. This is a quick win. | ☐ PENDING |
| T0-2 | `src/pages/api/analysis/github.ts` | 36 | `no-explicit-any` | Change `catch (error: any)` to `catch (error: unknown)`. Then, add a check inside the catch block, e.g., `if (error instanceof Error) { ... }`. | ☐ PENDING |
| T0-3 | `src/pages/api/integrations/github/connect.ts` | 57 | `no-explicit-any` | Apply the same `catch (error: unknown)` pattern as in `T0-2`. | ☐ PENDING |
| T0-4 | `src/pages/dashboard.tsx` | 108, 135 | `no-explicit-any` | Temporarily use the type `Record<string, any>` as a placeholder to unblock the build. Add a `// TODO: Define a strong type for the analysis report` comment above each usage. We will fix this properly in Phase 1. | ☐ PENDING |
| T0-5 | `src/lib/githubService.ts` | 45, 65, 83 | `no-explicit-any` | This is the most complex task. For now, apply the same `Record<string, any>` placeholder fix as in `T0-4` to get the build passing. Add `// TODO:` comments. | ☐ PENDING |

**Verification for Phase 0:**
- [ ] Run `npm run build`. It **must** complete successfully.

---

### ☐ Phase 1: Strengthen Type Safety

**Goal:** Eliminate the temporary `any` types introduced in Phase 0 and strengthen our data contracts.

| Task ID | File | Task | Action | Status |
| :--- | :--- | :--- | :--- | :--- |
| T1-1 | `src/lib/githubService.ts` | Define `GithubRepo` type | Inspect the response from the `octokit.repos.listForAuthenticatedUser()` method. Create an interface `GithubRepo` with the key properties you see (e.g., `id: number`, `name: string`, `stargazers_count: number`, `language: string | null`). Replace the `Record<string, any>` from T0-5 with `GithubRepo[]`. | ☐ PENDING |
| T1-2 | `src/lib/githubService.ts` | Define `CommitActivity` type | Similarly, inspect the response for commit activity and create a `CommitActivity` interface. Update the function signature. | ☐ PENDING |
| T1-3 | `src/pages/dashboard.tsx` | Use Strong Types | Import the new `GithubRepo` and `CommitActivity` types. Replace the `Record<string, any>` placeholders from T0-4 with these new, strong types. | ☐ PENDING |

**Verification for Phase 1:**
- [ ] Run `npm run build`. It must complete successfully.
- [ ] Run `npm run test`. All existing tests must still pass.

---

### ☐ Phase 2: Critical Security Review

**Goal:** Methodically review and mitigate all high-risk security warnings.

| Task ID | Issue | Action | Status |
| :--- | :--- | :--- | :--- |
| T2-1 | `security/detect-object-injection` | **For each warning:** Identify where the variable key comes from. If it's from a controlled, predictable source (like iterating over known object keys), it's likely safe. If it comes from external input (e.g., a URL query parameter), it must be validated against an allow-list of safe keys before being used. Ask for help if you are unsure. | ☐ PENDING |
| T2-2 | `security/detect-non-literal-fs-filename` | **For each warning:** These are in our scripts. The rule is flagging that we use variables to construct file paths. This is okay *if and only if* the variable part of the path is derived from a trusted source (e.g., a filename read from the *same* directory). For each case that you deem safe, add a disable comment with a clear justification. **Example:** `// eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is constructed from a filename within the same directory, which is a trusted source in this script.` | ☐ PENDING |

**Verification for Phase 2:**
- [ ] Run `npm run lint`. All `security/*` warnings should be resolved (fixed or justifiably disabled).

---

### ☐ Phase 3: Code Quality Cleanup

**Goal:** Fix the remaining low-hanging fruit to improve overall code hygiene.

| Task ID | Issue | Action | Status |
| :--- | :--- | :--- | :--- |
| T3-1 | `@typescript-eslint/no-unused-vars` | Globally search for this warning and remove all unused variables. | ☐ PENDING |
| T3-2 | `@next/next/no-img-element` | In `src/pages/dashboard.tsx`, replace the `<img>` with the Next.js `<Image>` component. Remember to add the image's hostname to `next.config.js` if it's an external URL. | ☐ PENDING |
| T3-3 | `scripts/debug/read-jobs.ts` | `Parsing error` | The file is syntactically incorrect. Delete this file as it appears to be for temporary debugging. | ☐ PENDING |

**Verification for Phase 3:**
- [ ] Run `npm run lint`. The output should be significantly cleaner.
- [ ] Run `npm run build` and `npm run test` to ensure no regressions.

---

### ☐ Phase 4: Investigation (Do Not Implement)

**Goal:** Investigate the duplicate script files before any action is taken.

| Task ID | Issue | Action | Status |
| :--- | :--- | :--- | :--- |
| T4-1 | Duplicate `*.cts` vs `*.ts` scripts | **INVESTIGATE ONLY.** Do not delete any files. Use `git log -- <filename>` on a few pairs of `.cts`/`.ts` files. Try to find the commit where the `.cts` files were introduced. The commit message may explain *why* they were needed. Document your findings in a new markdown file. | ☐ PENDING |

**This concludes the plan. The risky task of script cleanup is now a safe investigation-only task.**
