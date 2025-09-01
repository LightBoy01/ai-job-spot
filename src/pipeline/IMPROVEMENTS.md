# Pipeline Improvement Ideas

This document lists potential future enhancements for the data scraping pipeline.

## Scraper Enhancements

- **Robust Company Name Extraction:** The current method for getting the company name from the Foorilla detail page is fragile (it relies on finding `@ ...`). The scraper should be updated to pass the company name, which is available on the main list page, to the detail processing stage.

- **Advanced Interaction Handling:** The `configurable_scraper` could be extended to handle more complex interactions defined in the config file, such as:
  - Closing cookie consent banners.
  - Handling login pop-ups (e.g., by pressing 'escape' or clicking a 'close' button).
  - A more generic way to handle different types of pagination (e.g., infinite scroll, "next" buttons).

- **Smarter Pagination:** The current HTMX-based pagination (`hx-get` on the last `li`) is specific to Foorilla. A more generic pagination system could be designed to handle different site structures.

## Pipeline & Data Integrity

- **Schema Validation for Scraped Data:** Implement a validation step (e.g., using Pydantic or Zod-like schemas in Python) to ensure that the data extracted by a scraper conforms to the expected `JobDetails` TypedDict before being processed and saved. This would catch scraper bugs earlier.

- **Enhanced Error Handling & Retries:** Implement a more robust retry mechanism (e.g., with exponential backoff) for network-related errors within the `fetch_page_html` function.

- **Configuration Secrets:** For scrapers that might require API keys or logins in the future, establish a pattern for securely managing those secrets within the configuration structure, likely by referencing environment variables.
