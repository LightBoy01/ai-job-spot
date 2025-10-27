## Why
The existing data pipeline relies on a separate Python/Scrapy stack, which creates a disjointed development experience and prevents code sharing. Migrating to a unified TypeScript-based pipeline using Crawlee will improve maintainability, streamline the development workflow, and align with our "Unified TypeScript Ecosystem" architectural principle.

## What Changes
- **BREAKING:** Decommission the existing Python-based data pipeline.
- Replace the scraping logic with a new implementation using Node.js, TypeScript, and the Crawlee library.
- The new pipeline will read its configuration from a local source (e.g., `pipeline_config.json`).
- The pipeline will perform a duplicate check against existing job postings before yielding new data.
- The output will be new job Markdown files created in the `data/pending_review/` directory.
- The GitHub Actions workflow (`.github/workflows/pipeline.yml`) will be updated to run the new TypeScript-based pipeline.

## Impact
- **Affected specs:** A new `data-pipeline` capability spec will be created.
- **Affected code:**
    - The entire Python pipeline will be removed.
    - A new `src/data-pipeline` directory will house the new implementation.
    - `.github/workflows/pipeline.yml` will be modified.
    - The `npm run seed` script may need adjustments to integrate with the new pipeline's output.