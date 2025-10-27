## 1. Pipeline Implementation
- [ ] 1.1. Set up `Crawlee` with `Playwright` in the new `src/data-pipeline` directory.
- [ ] 1.2. Port the core scraping logic from the Python spider to a new `PlaywrightCrawler`.
- [ ] 1.3. Implement a duplicate check against job files in `src/job-descriptions` and `data/pending_review`.
- [ ] 1.4. Implement the output logic to create new job Markdown files in `data/pending_review/`.
- [ ] 1.5. Add comprehensive error handling and logging to the pipeline.

## 2. Workflow Integration
- [ ] 2.1. Create a new `npm run pipeline:run` script in `package.json` to execute the pipeline.
- [ ] 2.2. Update the `.github/workflows/pipeline.yml` to use a Node.js environment.
- [ ] 2.3. Modify the workflow to run the `npm run pipeline:run` script.
- [ ] 2.4. Configure the workflow to save the contents of `data/pending_review` as a downloadable artifact.

## 3. Documentation
- [ ] 3.1. Update the project's `README.md` to reflect the new data pipeline commands and workflow.
- [ ] 3.2. Ensure the new `data-pipeline` spec is complete and accurate.