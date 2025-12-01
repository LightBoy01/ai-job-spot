# Refined Data Pipeline Improvement Plan (2025-10-09)

**Objective:** To systematically implement the recommendations from the production-readiness review, transforming the data pipeline into a secure, robust, and professional-grade system.

**Guiding Principles:** This plan is structured by priority ("Put First Things First"). It incorporates not just technical tasks but also the essential engineering processes of testing, review, and documentation required for sustainable development.

---

## Engineering Process & Risk Management

**Standard Process for All Tasks:** Unless otherwise noted, every task in this plan **must** follow this process:
1.  **Implement:** Perform the core technical action.
2.  **Test:** Write or update unit/integration tests to validate the change and ensure no regressions were introduced.
3.  **Review:** Submit the changes for a mandatory code review by a project peer.
4.  **Document:** Update any relevant documentation (`README.md`, etc.) with changes to dependencies, environment variables, or core patterns.

**Risk Mitigation:** For significant architectural changes (Phase 3 and 4), consider using feature flags to enable a safe rollout and quick rollback if issues are discovered post-deployment.

---

## Phase 1: Immediate - Critical Security Hardening

**Honest Assessment:** This phase is non-negotiable and must be completed immediately. The command injection vulnerability represents a direct and severe threat to the system.

*   **Task 1.1: Remediate Command Injection Vulnerability in `article-parser.ts`**
    *   **Effort Estimate:** Small (S)
    *   **Action:** Replace the synchronous, insecure `execSync` call with the asynchronous `spawn` method from the `child_process` module.
    *   **Definition of Done:** The `url` is no longer used to construct a shell command string. The parser successfully fetches content from a test URL requiring the Selenium fallback. All steps in the Standard Process are complete.

---

## Phase 2: High Priority - Robustness & Data Integrity

**Honest Assessment:** This phase addresses the most significant weaknesses in the pipeline's robustness. Completing it will prevent common runtime errors and improve data quality.

**Note on Execution:** The tasks in this phase are largely independent and can be worked on in parallel to accelerate completion.

*   **Task 2.1: Implement Parser Type Safety with `zod`**
    *   **Effort Estimate:** Medium (M)
    *   **Action:** Refactor `hiring_cafe_api_parser.ts` to use `zod` for schema definition and data parsing.
    *   **Definition of Done:** The `data as any` assertion is removed. Incoming data is safely parsed against a Zod schema. The `README.md` is updated to reflect `zod` as a new dependency and pattern. All steps in the Standard Process are complete.

*   **Task 2.2: Implement Input Sanitization for HTML Content**
    *   **Effort Estimate:** Small (S)
    *   **Action:** Integrate `isomorphic-dompurify` to sanitize all externally sourced HTML content before it is written.
    *   **Definition of Done:** A unit test proves that a string containing a `<script>` tag has the tag removed after sanitization. All steps in the Standard Process are complete.

*   **Task 2.3: Improve Article Content Extraction**
    *   **Effort Estimate:** Medium (M)
    *   **Action:** Replace the brittle, hardcoded selector list in `article-parser.ts` with Mozilla's `@mozilla/readability` library.
    *   **Definition of Done:** The hardcoded `selectors` array is removed. A regression test suite confirms that the new implementation successfully parses all articles the previous parser was known to handle, plus a set of new, diverse articles. All steps in the Standard Process are complete.

---

## Phase 3: Medium Priority - Scalability & Monitoring

**Honest Assessment:** These tasks are essential for scaling the pipeline and understanding its health over time. They are critical for production viability.

*   **Task 3.1: Implement Parallel Source Processing**
    *   **Effort Estimate:** Medium (M)
    *   **Action:** Refactor the main orchestration loop in `main.ts` to process independent sources concurrently, with a concurrency limit.
    *   **Definition of Done:** The pipeline's total execution time is demonstrably reduced when running with multiple independent sources. A failure in one source does not stop others. The change is tested under a feature flag if deemed necessary. All steps in the Standard Process are complete.

*   **Task 3.2: Introduce Basic Observability Metrics**
    *   **Effort Estimate:** Small (S)
    *   **Action:** Create and integrate a simple metrics collector.
    *   **Definition of Done:** Every pipeline run concludes with a logged summary of what was processed, items ingested, and errors. All steps in the Standard Process are complete.

---

## Phase 4: Long-Term - Future-Proofing Architecture

**Honest Assessment:** This is a significant architectural refactoring. The benefit may not outweigh the implementation cost until data volumes grow substantially. It should be considered a strategic, long-term goal.

*   **Task 4.1: Refactor to a Streaming Architecture**
    *   **Effort Estimate:** Extra Large (XL)
    *   **Action:** Re-architect the pipeline to process data as a stream, avoiding buffering large arrays in memory.
    *   **Definition of Done:** The `allProcessedData` array is eliminated. The pipeline can process a file with millions of items with constant, low memory usage. This change would require its own design document and rigorous testing. All steps in the Standard Process are complete.