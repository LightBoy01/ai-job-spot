# Data Pipeline Enhancement Plan

**Objective:** To systematically address the findings from the `DATA_PIPELINE_REVIEW.md` and elevate the data pipeline to a production-grade, maintainable, and well-documented system.

**Guiding Principles:** This plan adheres to our "grand mind rules" by prioritizing foundational stability and operability first. Each task will follow the standard engineering process: Implement -> Test -> Review -> Document.

---

## Phase 1: Foundational Stability (High Priority)

**Honest Assessment:** This phase is crucial for ensuring the long-term stability and maintainability of the pipeline. A robust test suite is the bedrock of a healthy codebase.

*   **Task 1.1: Enhance Test Coverage for `article-parser.ts`**
    *   **Action:** Add more diverse and complex test cases to `__tests__/data-pipeline/article-parser.test.ts`.
    *   **Details:**
        1.  Add a test case for an article that does not have a clear `<article>` or `<main>` tag, forcing `Readability` to work harder.
        2.  Add a test case for an article that includes complex Markdown elements like code blocks, blockquotes, and lists.
        3.  Add a test case for a known difficult-to-parse article URL (if one can be found) to create a real-world regression test.
    *   **Definition of Done:** The test suite for `article-parser.ts` is expanded, and code coverage for the file is demonstrably increased.

*   **Task 1.2: Implement Integration Tests for the Data Pipeline**
    *   **Action:** Create a new integration test suite for the `main.ts` orchestrator.
    *   **Details:**
        1.  Create a new test file: `__tests__/data-pipeline/main.integration.test.ts`.
        2.  In this file, mock the `getJobSources` and `getBriefingSources` functions to return a single, controlled mock source.
        3.  The mock source will return a known, static set of raw data (e.g., 2-3 items).
        4.  Mock the `fs.writeFile` and `fs.rename` modules to prevent actual file system operations. Instead, capture the calls and their arguments.
        5.  Run the `orchestrateJobs` function.
        6.  Assert that the mock file system functions were called with the expected file names and content.
    *   **Definition of Done:** A new integration test successfully runs the core pipeline logic from source fetching to (mocked) file writing, verifying the end-to-end data flow.

---

## Phase 2: Operability & Monitoring (Medium Priority)

**Honest Assessment:** These tasks will make the pipeline significantly easier to manage, debug, and monitor in a production environment.

*   **Task 2.1: Implement Structured Logging**
    *   **Action:** Replace all `console.log` and `console.error` calls throughout the data pipeline with a structured logging library like `pino`.
    *   **Details:**
        1.  Install `pino` and its pretty-printer for development (`pino-pretty`).
        2.  Create a centralized logger utility (e.g., `src/data-pipeline/utils/logger.ts`).
        3.  Systematically replace all `console.*` calls in `main.ts`, `parsers`, and other relevant files with the new logger, adding contextual information (e.g., `{source: source.name, itemId: id}`).
    *   **Definition of Done:** All pipeline output is structured JSON, allowing for easy filtering and analysis by log management systems.

*   **Task 2.2: Unified Configuration System**
    *   **Action:** Consolidate all pipeline configuration into a single, unified, and type-safe system.
    *   **Details:**
        1.  Create a new configuration file, e.g., `src/data-pipeline/config.ts`.
        2.  Define a `zod` schema for the entire pipeline configuration to ensure type safety.
        3.  Move settings from `pipeline.config.jobs.ts` and `pipeline.config.briefings.ts` into this central file.
        4.  Refactor the code to import configuration from this single source.
    *   **Definition of Done:** All pipeline configuration is managed from one file, is type-safe, and is easily extensible.

---

## Phase 3: Documentation & Housekeeping (Low Priority)

**Honest Assessment:** This phase is about professionalizing the project, making it easier for current and future developers to work with.

*   **Task 3.1: Update Project `README.md`**
    *   **Action:** Thoroughly update the main `README.md` to reflect the current state of the data pipeline.
    *   **Details:**
        1.  Add a dedicated "Data Pipeline" section.
        2.  Describe the high-level architecture (mentioning the streaming design as a future goal).
        3.  Provide clear, step-by-step instructions on how to run the pipeline (`npm run pipeline:jobs`, `npm run pipeline:briefings`).
        4.  Document all necessary environment variables and configuration options.
        5.  Explain how to run the pipeline's test suite.
    *   **Definition of Done:** The `README.md` is a comprehensive and up-to-date guide for any developer looking to work on the data pipeline.
