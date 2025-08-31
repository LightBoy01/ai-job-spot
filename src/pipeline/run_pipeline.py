import json
import sys
import itertools
import time
import os
import re
import sqlite3
from datetime import datetime, timedelta
import yaml # Added for PyYAML

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

def transform_job_data(raw_job: dict, source_file: str = "scraped_job") -> dict:
    """
    Transforms a single raw job dictionary from a scraper into the 
    structured format expected by the AI Job Spot admin panel.
    """
    # Generate a unique ID based on company and title to help prevent duplicates
    company_slug = re.sub(r'[^a-z0-9]+', '-', raw_job.get('company', 'nocompany').lower()).strip('-')
    title_slug = re.sub(r'[^a-z0-9]+', '-', raw_job.get('title', 'notitle').lower()).strip('-')
    unique_id = f"job-scraped-{company_slug}-{title_slug}"

    # Handle dates: use existing if valid, otherwise default to now
    try:
        posted_date_str = raw_job.get('postedDate')
        if posted_date_str:
            # Attempt to parse various ISO formats, including those with microseconds
            if '.' in posted_date_str and posted_date_str.endswith('Z'):
                posted_date = datetime.fromisoformat(posted_date_str.replace('Z', ''))
            elif posted_date_str.endswith('Z'):
                posted_date = datetime.strptime(posted_date_str, "%Y-%m-%dT%H:%M:%SZ")
            else:
                posted_date = datetime.fromisoformat(posted_date_str)
        else:
            posted_date = datetime.utcnow()
    except (ValueError, TypeError):
        posted_date = datetime.utcnow()

    # Calculate expiration date based on posted date (default 90 days)
    expiration_date = posted_date + timedelta(days=90)

    # Generate tags from available data
    tags = [tag.strip() for tag in raw_job.get('tags', []) if tag.strip()] # Clean existing tags
    tags.append("Scraped")
    if raw_job.get('company'):
        tags.append(raw_job['company'])
    if raw_job.get('location'):
        # Simple location tag, could be improved with normalization
        tags.append(raw_job['location'].split(',')[0].strip())
    tags = list(set(tags)) # Remove duplicates

    # The description from the scrapers is already in HTML format or should be treated as such
    description_html = raw_job.get('description', raw_job.get('summary', '<p>No description provided.</p>'))

    prepared_job = {
        "id": unique_id,
        "title": raw_job.get('title', 'N/A'),
        "company": raw_job.get('company', 'N/A'),
        "location": raw_job.get('location', 'N/A'),
        "description": description_html,
        "applicationLink": raw_job.get('link', raw_job.get('applicationLink', '#')),
        "postedDate": posted_date.isoformat(timespec='milliseconds') + 'Z',  # ISO 8601 format with milliseconds
        "expirationDate": expiration_date.isoformat(timespec='milliseconds') + 'Z', # ISO 8601 format with milliseconds
        "salaryRange": raw_job.get('salaryRange', 'N/A'),
        "jobLevel": raw_job.get('jobLevel', 'N/A'),
        "employeeRole": raw_job.get('employeeRole', 'N/A'),
        "isNew": True,
        "tags": tags,
        "source": os.path.basename(source_file), # Track the origin
        "responsibilities": raw_job.get('responsibilities', []),
        "qualifications": raw_job.get('qualifications', []),
    }
    return prepared_job

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

    # Dates are already ISO formatted from transform_job_data, no need to re-convert
    # if isinstance(frontmatter['postedDate'], datetime):
    #     frontmatter['postedDate'] = frontmatter['postedDate'].isoformat() + 'Z'
    # if isinstance(frontmatter['expirationDate'], datetime):
    #     frontmatter['expirationDate'] = frontmatter['expirationDate'].isoformat() + 'Z'

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

# --- Main Pipeline Logic ---
from .scrapers.rss_scraper import stream_rss_jobs
from . import configurable_scraper # New import
from .utils import get_driver, close_driver # New import

def main():
    """Main function to orchestrate the entire data pipeline."""
    # Use log_file from config
    LOG_FILE = os.path.join(os.path.dirname(__file__), config['log_file'])

    original_stdout = sys.stdout
    original_stderr = sys.stderr

    db_conn = None
    browser = None
    page = None

    try:
        # Temporarily disable log file redirection for debugging
        # All output will go to original stdout/stderr
        log_file_opened = False # Ensure this remains False

            
            print("Initializing database...")
            init_db()
            db_conn = sqlite3.connect(DB_FILE)

            print("Starting pipeline run: Scrape and Save as Markdown...")
            
            browser = get_driver() # Get the Playwright browser instance
            page = browser.new_page() # Create a new page from the browser

            all_raw_job_streams = []

            if "rss_scraper" in config.get("scrapers_enabled", []):
                rss_stream = stream_rss_jobs(config) or []
                all_raw_job_streams.append(rss_stream)

            if "foorilla_scraper" in config.get("scrapers_enabled", []):
                # Load foorilla-specific config for configurable_scraper
                foorilla_config_path = os.path.join(os.path.dirname(__file__), 'config', 'foorilla_config.json')
                foorilla_site_config = configurable_scraper.load_config(foorilla_config_path) # Need to import load_config from configurable_scraper
                foorilla_limit = config["scraper_limits"].get("foorilla_scraper_limit", 2) # Default to 2 if not in config
                foorilla_stream = configurable_scraper.stream_jobs_from_site(page, foorilla_site_config, limit=foorilla_limit) # Pass page
                all_raw_job_streams.append(foorilla_stream)

            all_raw_job_streams = itertools.chain(*all_raw_job_streams)

            print("\n--- Scraping and Saving Jobs as Markdown Files ---")
            new_job_count = 0
            skipped_job_count = 0

            for raw_job in all_raw_job_streams:
                # Transform raw job data before processing
                transformed_job = transform_job_data(raw_job)
                job_url = transformed_job.get('applicationLink') # Use transformed link for deduplication
                job_id = transformed_job.get('id') # Use transformed ID for deduplication

                if not job_url:
                    print(f" - WARNING: Skipping job with no URL: {transformed_job.get('title')}")
                    continue

                if is_url_seen(db_conn, job_url):
                    print(f" - Skipping duplicate job (URL already seen): {transformed_job.get('title')}")
                    skipped_job_count += 1
                    continue

                print(f" > Processing new job '{transformed_job.get('title')}'...")
                if save_job_as_markdown(transformed_job): # Pass transformed job data
                    add_url_to_db(db_conn, job_url)
                    new_job_count += 1
                time.sleep(1)

            print(f"\nPipeline finished successfully.")
            print(f"Saved {new_job_count} new jobs for review.")
            print(f"Skipped {skipped_job_count} duplicate jobs.")

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
        
        if 'f' in locals() and log_file_opened: # Close log file only if it was opened
            f.close()

        # Print final message to original stdout
        original_stdout.write(f"Pipeline run complete. Output logged to {LOG_FILE}\n")

if __name__ == "__main__":
    main()
