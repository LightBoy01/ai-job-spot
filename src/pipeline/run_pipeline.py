import sys
import os

# Ensure the project root is on the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import json
import itertools
import time
import os
import re
import sqlite3
import signal
import traceback
from datetime import datetime, timedelta
import yaml # Added for PyYAML
from src.pipeline.models import Job
from pydantic import ValidationError
from typing import Optional

# --- Signal Handler for Graceful Shutdown ---
def handle_signal(signum, frame):
    """Catches termination signals and prints a traceback."""
    print("\n--- FATAL: RECEIVED SIGNAL ---", file=sys.__stderr__)
    print(f"Received signal {signum}. Forcing traceback and exit.", file=sys.__stderr__)
    traceback.print_stack(frame)
    sys.exit(1)

# Register the signal handler for SIGTERM
signal.signal(signal.SIGTERM, handle_signal)

# --- Configuration Loading ---
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_config.json')
try:
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    sys.stderr.write(f"ERROR: Could not load pipeline_config.json: {e}\n")
    sys.exit(1)

# --- Database Setup ---
DB_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_cache.db')

def init_db():
    """Initializes the database and creates the seen_jobs table if it doesn't exist."""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS seen_jobs (
                url TEXT PRIMARY KEY,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def is_url_seen(conn, url: str) -> bool:
    """Checks if a URL has already been scraped."""
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM seen_jobs WHERE url = ?", (url,))
    return cursor.fetchone() is not None

def add_url_to_db(conn, url: str):
    """Adds a new URL to the database."""
    try:
        conn.execute("INSERT INTO seen_jobs (url) VALUES (?)", (url,))
        conn.commit()
    except sqlite3.IntegrityError:
        # This can happen in rare race conditions, it's safe to ignore.
        pass

from src.pipeline.models import Job
from pydantic import ValidationError

# ... (keep other imports)

def transform_job_data(raw_job: dict, source_file: str = "scraped_job") -> Optional[Job]:
    """
    Transforms a single raw job dictionary from a scraper into the 
    structured Job model.
    """
    try:
        # Generate a unique ID based on company and title to help prevent duplicates
        company_slug = re.sub(r'[^a-z0-9]+', '-', raw_job.get('company', 'nocompany').lower()).strip('-')
        title_slug = re.sub(r'[^a-z0-9]+', '-', raw_job.get('title', 'notitle').lower()).strip('-')
        unique_id = f"job-scraped-{{company_slug}}-{{title_slug}}"

        # The description from the scrapers is already in HTML format or should be treated as such
        description_html = raw_job.get('description', raw_job.get('summary', '<p>No description provided.</p>'))

        job = Job(
            id=unique_id,
            title=raw_job.get('title', 'N/A'),
            company=raw_job.get('company', 'N/A'),
            location=raw_job.get('location', 'N/A'),
            description=description_html,
            applicationLink=raw_job.get('link', raw_job.get('applicationLink', 'https://invalid.com')),
            postedDate=raw_job.get('postedDate', datetime.utcnow()),
            salaryRange=raw_job.get('salaryRange'),
            jobLevel=raw_job.get('jobLevel'),
            employeeRole=raw_job.get('employeeRole'),
            tags=raw_job.get('tags', []),
            source=os.path.basename(source_file),
            responsibilities=raw_job.get('responsibilities', []),
            qualifications=raw_job.get('qualifications', []),
        )
        return job
    except ValidationError as e:
        print(f"Validation error for job {{raw_job.get('title')}}: {{e}}", file=sys.stderr)
        return None

# --- Helper function to create Markdown files ---
def save_job_as_markdown(job_data: dict):
    """
    Takes a transformed job dictionary and saves it as a Markdown file
    with YAML frontmatter in the pending review directory.
    """
    # Use output_directory from config
    output_dir = os.path.join(os.path.dirname(__file__), config['output_directory'])
    os.makedirs(output_dir, exist_ok=True)

    company_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('company', 'nocompany').lower()).strip('-')
    title_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('title', 'notitle').lower()).strip('-')[:50]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"job-scraped-{company_slug}-{title_slug}-{timestamp}.md"
    filepath = os.path.join(output_dir, filename)

    # Use the 'id' from the transformed job data
    job_id = job_data.get('id', os.path.splitext(filename)[0])

    frontmatter = {
        'id': job_id,
        'title': job_data.get('title', 'N/A'),
        'company': job_data.get('company', 'N/A'),
        'location': job_data.get('location', 'N/A'),
        'applicationLink': job_data.get('applicationLink', '#'),
        'postedDate': job_data.get('postedDate', datetime.now().isoformat() + 'Z'),
        'expirationDate': job_data.get('expirationDate', None),
        'tags': job_data.get('tags', []),
        'status': job_data.get('status', 'pending_review'), # Use status from transformed data
        'jobLevel': job_data.get('jobLevel', 'N/A'),
        'employeeRole': job_data.get('employeeRole', 'N/A'),
        'salaryRange': job_data.get('salaryRange', 'N/A'),
        'source': job_data.get('source', 'N/A'),
        'isNew': job_data.get('isNew', True), # Use isNew from transformed data
    }

    content_body = job_data.get('description', '<p>No description provided.</p>')
    
    if job_data.get('responsibilities'):
        content_body += "\n\n### Responsibilities\n\n" + "\n".join([f"- {item}" for item in job_data['responsibilities']])
    if job_data.get('qualifications'):
        content_body += "\n\n### Qualifications\n\n" + "\n".join([f"- {item}" for item in job_data['qualifications']])

    frontmatter_yaml = yaml.dump(frontmatter, sort_keys=False, default_flow_style=False, allow_unicode=True)
    full_content = f"---\n{frontmatter_yaml}---\n\n{content_body}"

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(full_content)
        print(f"  - Successfully saved job to: {filepath}")
        return True
    except IOError as e:
        print(f"  - ERROR: Could not write file {filepath}. Reason: {e}", file=sys.stderr)
        return False

def is_job_filtered(job: Job, config: dict) -> bool:
    """Checks if a job should be filtered based on the configuration."""
    filters = config.get("filters", {})
    if not filters:
        return False

    # Keyword filtering
    keywords = filters.get("keywords", [])
    if keywords:
        search_text = f"{{job.title}} {{job.description}}".lower()
        if not any(re.search(r'\b' + re.escape(keyword.lower()) + r'\b', search_text) for keyword in keywords):
            return True

    # Location filtering
    locations = filters.get("locations", [])
    if locations:
        if not any(location.lower() in job.location.lower() for location in locations):
            return True

    # Company filtering
    companies = filters.get("companies", [])
    if companies:
        if not any(company.lower() in job.company.lower() for company in companies):
            return True

    return False
from src.pipeline.scrapers.rss_scraper import stream_rss_jobs
from src.pipeline import configurable_scraper # New import
from src.pipeline.utils import get_driver, close_driver # New import

def main():
    """Main function to orchestrate the entire data pipeline."""
    # Use log_file from config
    LOG_FILE = os.path.join(os.path.dirname(__file__), config['log_file'])

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    log_file_opened = False

    try:
        f = open(LOG_FILE, 'w', encoding='utf-8')
        log_file_opened = True
        sys.stdout = f
        sys.stderr = f

        print("Initializing database...")
        init_db()
        db_conn = sqlite3.connect(DB_FILE)

        print("Starting pipeline run: Scrape and Save as Markdown...")
        
        browser = get_driver() # Get the Playwright browser instance
        page = browser.new_page() # Create a new page from the browser

        # --- AGGRESSIVE RESOURCE BLOCKING ---
        # Block images, css, fonts to save memory
        def block_unnecessary_requests(route):
            if route.request.resource_type in {"image", "stylesheet", "font", "media"}:
                route.abort()
            else:
                route.continue_()
        
        page.route("**/*", block_unnecessary_requests)
        # --- END RESOURCE BLOCKING ---

        all_raw_job_streams = []
        scrapers_to_run = config.get("scrapers_enabled", [])

        for scraper_name in scrapers_to_run:
            if scraper_name == "rss_scraper":
                rss_stream = stream_rss_jobs(config) or []
                all_raw_job_streams.append(rss_stream)
            elif scraper_name == "foorilla_scraper":
                foorilla_config_path = os.path.join(os.path.dirname(__file__), 'config', 'foorilla_config.json')
                foorilla_site_config = configurable_scraper.load_config(foorilla_config_path)
                foorilla_limit = config["scraper_limits"].get("foorilla_scraper_limit", 2)
                foorilla_stream = configurable_scraper.stream_jobs_from_site(page, foorilla_site_config, limit=foorilla_limit)
                all_raw_job_streams.append(foorilla_stream)
            else:
                print(f"WARNING: Unknown scraper '{{scraper_name}}' in config. Skipping.", file=sys.stderr)

        all_raw_job_streams = itertools.chain(*all_raw_job_streams)

        print("\n--- Scraping and Saving Jobs as Markdown Files ---")
        new_job_count = 0
        skipped_job_count = 0
        filtered_out_count = 0

        # Get keywords for filtering
        keywords = config.get("global_filter_keywords", [])
        if not keywords:
            print(" - WARNING: No global_filter_keywords found in config. No keyword filtering will be applied.")

        for raw_job in all_raw_job_streams:
            # --- KEYWORD FILTERING ---
            if keywords:
                title = raw_job.title if raw_job.title else ''
                summary = raw_job.description if raw_job.description else ''
                search_text = f"{title} {summary}".lower()
                
                if not any(re.search(r'\b' + re.escape(keyword.lower()) + r'\b', search_text) for keyword in keywords):
                    filtered_out_count += 1
                    continue
            # --- END KEYWORD FILTERING ---

            # The scraper now returns a validated Pydantic Job object, so no transformation is needed.
            transformed_job = raw_job

            job_url = str(transformed_job.applicationLink)

            if is_url_seen(db_conn, job_url):
                skipped_job_count += 1
                continue

            print(f" > Processing new job '{{transformed_job.title}}'...")
            if save_job_as_markdown(transformed_job.dict()): # Pass transformed job data as dict
                add_url_to_db(db_conn, job_url)
                new_job_count += 1
            time.sleep(1)

        print(f"\nPipeline finished successfully.")
        print(f"Saved {new_job_count} new jobs for review.")
        print(f"Skipped {skipped_job_count} duplicate jobs (already seen).")
        print(f"Filtered out {filtered_out_count} jobs (did not match keywords).")

    except Exception as e:
        # Print to original stderr to ensure visibility in CI/CD logs
        original_stderr.write(f"A critical error occurred in the main pipeline: {e}\n")
        import traceback
        original_stderr.write(traceback.format_exc())
        
        # Also print to redirected stderr (log file)
        print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
    finally:
        # Restore original stdout/stderr before any further prints
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        
        print("Shutting down browser driver and database connection...")
        if page: # Close the page first
            page.close()
        if browser: # Then close the browser
            close_driver() # Use the new close_driver function
        if db_conn:
            db_conn.close()
        
        if log_file_opened:
            f.close()

        # Print final message to original stdout
        original_stdout.write(f"Pipeline run complete. Output logged to {LOG_FILE}\n")

if __name__ == "__main__":
    main()