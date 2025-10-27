## ADDED Requirements

### Requirement: Configurable Scraping
The system SHALL execute a web scraping process based on a provided configuration file.

#### Scenario: Run pipeline with config
- **GIVEN** a valid `pipeline_config.json` exists.
- **WHEN** the user executes the pipeline run command.
- **THEN** the system initiates a Crawlee-based scrape using Playwright.

### Requirement: Duplicate Prevention
The system SHALL prevent the creation of duplicate job postings.

#### Scenario: New job is unique
- **GIVEN** the pipeline scrapes a job that does not exist in `src/job-descriptions` or `data/pending_review`.
- **WHEN** the pipeline processes the job.
- **THEN** a new Markdown file for the job is created in `data/pending_review/`.

#### Scenario: Job is a duplicate
- **GIVEN** the pipeline scrapes a job that already exists in `src/job-descriptions` or `data/pending_review`.
- **WHEN** the pipeline processes the job.
- **THEN** the job is discarded and no new file is created.

### Requirement: Artifact Generation
The system SHALL produce an artifact of scraped jobs.

#### Scenario: Pipeline completes successfully
- **GIVEN** the pipeline run is triggered via the GitHub Actions workflow.
- **WHEN** the pipeline successfully scrapes one or more new jobs.
- **THEN** the workflow provides a downloadable artifact named `scraped-jobs` containing the new Markdown files from `data/pending_review/`.
