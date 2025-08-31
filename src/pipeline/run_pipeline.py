import json
import sys
import itertools
import time
import os
import re
import sqlite3
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

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

# --- Deep Scraper & Parser ---
def deep_scrape_job_details(url: str):
    """
    Navigates to the job details page and returns the parsed HTML soup.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()  # Raise an exception for bad status codes
        soup = BeautifulSoup(response.text, 'html.parser')
        return soup
    except requests.RequestException as e:
        print(f"  - ERROR: Could not fetch URL {url}. Reason: {e}", file=sys.stderr)
        return None

def parse_job_html(soup: BeautifulSoup, original_job_data: dict):
    """
    Parses the job detail HTML to extract structured data.
    Tries several common patterns to find the job description.
    """
    print("    - Parsing deep-scraped HTML for details...")
    clean_data = original_job_data.copy()

    # Try to find title, company, location from the detailed page
    title_tag = soup.find(['h1'])
    if title_tag:
        clean_data['title'] = title_tag.get_text(strip=True)

    # Generic search for description container
    description_selectors = [
        {'id': 'job-description'},
        {'class': 'job-description'},
        {'id': 'content'},
        {'role': 'main'}
    ]
    
    description_div = None
    for selector in description_selectors:
        description_div = soup.find('div', attrs=selector)
        if description_div:
            break
    
    if not description_div:
        description_div = soup.body # Fallback to the whole body

    if description_div:
        # Remove known junk sections before converting
        for junk_selector in ['.job-header', '.job-actions', 'nav', 'footer', '.similar-jobs', 'script', 'style']:
                for tag in description_div.select(junk_selector):
                    tag.decompose()

        # Convert the cleaned div to Markdown
        description_text = md(str(description_div), heading_style="ATX")
        
        # Simple parsing for responsibilities/qualifications from the markdown
        lines = description_text.split('\n')
        responsibilities = []
        qualifications = []
        current_section = 'description'
        clean_description_lines = []

        for line in lines:
            line_lower = line.lower()
            if 'responsibilities' in line_lower and '#' in line_lower:
                current_section = 'responsibilities'
                continue
            elif 'qualifications' in line_lower and '#' in line_lower:
                current_section = 'qualifications'
                continue
            
            if current_section == 'description':
                clean_description_lines.append(line)
            elif current_section == 'responsibilities':
                if line.strip().startswith( ('-', '*') ):
                    responsibilities.append(re.sub(r'^[\s\*\-]+|\s+
, '', line))
            elif current_section == 'qualifications':
                if line.strip().startswith( ('-', '*') ):
                    qualifications.append(re.sub(r'^[\s\*\-]+|\s+
, '', line))

        clean_data['description'] = "\n".join(clean_description_lines).strip()
        clean_data['responsibilities'] = responsibilities
        clean_data['qualifications'] = qualifications
        print("    - Successfully parsed job details.")
    else:
        print("    - WARNING: Could not find a known description container in the HTML.")
        clean_data['description'] = "Description not found."

    return clean_data

# --- Helper function to create Markdown files ---
def save_job_as_markdown(job_data: dict):
    """
    Takes a scraped job dictionary and saves it as a Markdown file
    with YAML frontmatter in the pending review directory.
    """
    output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'pending_review')
    os.makedirs(output_dir, exist_ok=True)

    company_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('company', 'nocompany').lower()).strip('-')
    title_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('title', 'notitle').lower()).strip('-')[:50]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"job-scraped-{company_slug}-{title_slug}-{timestamp}.md"
    filepath = os.path.join(output_dir, filename)

    job_id = os.path.splitext(filename)[0]

    frontmatter = {
        'id': job_id,
        'title': f"{job_data.get('title', 'N/A')}",
        'company': f"{job_data.get('company', 'N/A')}",
        'location': f"{job_data.get('location', 'N/A')}",
        'applicationLink': job_data.get('link', '#'),
        'postedDate': job_data.get('postedDate', datetime.now().isoformat() + 'Z'),
        'expirationDate': job_data.get('expirationDate', 'null'),
        'tags': job_data.get('tags', []),
        'status': 'pending_review',
        'jobLevel': f"{job_data.get('jobLevel', 'N/A')}",
        'employeeRole': f"{job_data.get('employeeRole', 'N/A')}",
        'salaryRange': f"{job_data.get('salaryRange', 'N/A')}",
        'source': f"{job_data.get('source', 'N/A')}",
    }

    content_body = job_data.get('description', '<p>No description provided.</p>')
    
    if job_data.get('responsibilities'):
        content_body += "\n\n### Responsibilities\n\n" + "\n".join([f"- {item}" for item in job_data['responsibilities']])
    if job_data.get('qualifications'):
        content_body += "\n\n### Qualifications\n\n" + "\n".join([f"- {item}" for item in job_data['qualifications']])

    frontmatter_str = "---\n"
    for key, value in frontmatter.items():
        if isinstance(value, list):
            if not value:
                frontmatter_str += f"{key}: []\n"
            else:
                frontmatter_str += f"{key}:\n"
                for item in value:
                    frontmatter_str += f'  - "{item}"\n'
        else:
            frontmatter_str += f"{key}: {value}\n"
    frontmatter_str += "---"

    full_content = f"{frontmatter_str}\n\n{content_body}"

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
from .scrapers.foorilla_scraper import stream_foorilla_jobs, get_driver

def main():
    """Main function to orchestrate the entire data pipeline."""
    LOG_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_run.log')

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    with open(LOG_FILE, 'w') as f:
        sys.stdout = f
        sys.stderr = f
        
        try:
            print("Initializing database...")
            init_db()
            db_conn = sqlite3.connect(DB_FILE)
            print("Starting pipeline run: Scrape and Save as Markdown...")
            driver = get_driver()
            
            try:
                rss_stream = stream_rss_jobs() or []
                foorilla_stream = stream_foorilla_jobs(driver, limit=2)

                all_raw_job_streams = itertools.chain(rss_stream, foorilla_stream)

                print("\n--- Scraping and Saving Jobs as Markdown Files ---")
                new_job_count = 0
                skipped_job_count = 0
                for raw_job in all_raw_job_streams:
                    job_url = raw_job.get('link') or raw_job.get('applicationLink')
                    if not job_url:
                        print(f"  - WARNING: Skipping job with no URL: {raw_job.get('title')}")
                        continue

                    if is_url_seen(db_conn, job_url):
                        print(f"  - Skipping duplicate job (URL already seen): {raw_job.get('title')}")
                        skipped_job_count += 1
                        continue
                    
                    print(f"  > Processing new job '{raw_job.get('title')}'...")

                    # --- Deep Scrape --- 
                    job_details_soup = deep_scrape_job_details(job_url)
                    if not job_details_soup:
                        print(f"  - WARNING: Could not retrieve job details from {job_url}. Skipping.")
                        continue
                    print(f"  - Successfully deep-scraped details for '{raw_job.get('title')}'")

                    # --- Parse HTML ---
                    clean_job_data = parse_job_html(job_details_soup, raw_job)

                    if save_job_as_markdown(clean_job_data):
                        add_url_to_db(db_conn, job_url)
                        new_job_count += 1
                    
                    time.sleep(1)

                print(f"\nPipeline finished successfully.")
                print(f"Saved {new_job_count} new jobs for review.")
                print(f"Skipped {skipped_job_count} duplicate jobs.")

            except Exception as e:
                print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
            finally:
                print("Shutting down browser driver...")
                if driver:
                    driver.quit()
                if db_conn:
                    db_conn.close()
        finally:
            sys.stdout = original_stdout
            sys.stderr = original_stderr
    
    print(f"Pipeline run complete. Output logged to {LOG_FILE}")

if __name__ == "__main__":
    main()
