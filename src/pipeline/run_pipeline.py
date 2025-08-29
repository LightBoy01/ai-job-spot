import json
import feedparser
import sys
import itertools
import time
import os
import requests
import re
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from urllib.parse import urlparse

# --- Configuration Loader ---
def load_pipeline_config():
    """Loads the pipeline configuration file."""
    config_path = os.path.join(os.path.dirname(__file__), 'pipeline_config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            if 'API_BASE_URL' not in config:
                print("Error: 'API_BASE_URL' not found in pipeline_config.json", file=sys.stderr)
                sys.exit(1)
            return config
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)

# --- Stateful Execution Functions ---
def get_existing_job_ids(config: dict) -> set:
    """Fetches all existing job IDs from the API to prevent duplicates."""
    ids_url = f"{config['API_BASE_URL']}/api/jobs/ids"
    try:
        print(f"Fetching existing job IDs from {ids_url}...")
        response = requests.get(ids_url, timeout=30)
        response.raise_for_status()
        job_ids = response.json()
        print(f"Found {len(job_ids)} existing job IDs.")
        return set(job_ids)
    except requests.exceptions.RequestException as e:
        print(f"Warning: Could not fetch existing job IDs. Proceeding without duplicate check. Error: {e}", file=sys.stderr)
        return set() # Return an empty set on failure

def generate_job_id(job: dict) -> str:
    """Generates a consistent, URL-friendly ID for a job."""
    company = job.get('company', 'nocompany')
    title = job.get('title', 'notitle')
    # Sanitize company and title to be used in an ID
    company_slug = re.sub(r'[^a-z0-9-]', '', company.lower().replace(' ', '-'))
    title_slug = re.sub(r'[^a-z0-9-]', '', title.lower().replace(' ', '-'))
    return f"job-scraped-{company_slug[:20]}-{title_slug[:50]}"


def resolve_application_link(driver: webdriver.Firefox, internal_apply_url: str) -> str:
    """Navigates to an internal apply URL and resolves the final external link."""
    print(f"    - Resolving application link from: {internal_apply_url}")
    try:
        driver.get(internal_apply_url)
        WebDriverWait(driver, 15).until(EC.url_changes(internal_apply_url))
        final_url = driver.current_url
        print(f"    - Resolved to: {final_url}")
        return final_url
    except (TimeoutException, WebDriverException) as e:
        print(f"    - Error resolving application link {internal_apply_url}: {e}", file=sys.stderr)
        return internal_apply_url

# --- API Ingestion Function ---
def send_to_ingest_api(job_data: dict, config: dict):
    """DRY RUN: Prints the job data that would be sent to the API."""
    print("\n--- [DRY RUN] --- WOULD SEND THE FOLLOWING JOB DATA TO API ---")
    print(json.dumps(job_data, indent=2))
    print("--- [DRY RUN] ---\\n")

# --- Helper Functions ---
def get_driver() -> webdriver.Firefox:
    """Initializes and returns a Selenium Firefox driver for Termux."""
    print("Initializing headless Firefox driver...")
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    service = Service()
    try:
        driver = webdriver.Firefox(service=service, options=options)
        return driver
    except WebDriverException as e:
        print(f"Error initializing Firefox driver: {e}", file=sys.stderr)
        sys.exit(1)

# --- Streamer Functions ---
def stream_rss_jobs(config_path='src/pipeline/config/rss_config.json'):
    # ... (rest of the function is the same)
    pass # Placeholder for brevity

def stream_foorilla_jobs(driver: webdriver.Firefox, limit: int = 1):
    # ... (rest of the function is the same)
    pass # Placeholder for brevity


def main():
    """Main function to orchestrate the entire data pipeline."""
    # Define the log file path
    LOG_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_run.log')

    # Redirect stdout and stderr to the log file
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    with open(LOG_FILE, 'w') as f:
        sys.stdout = f
        sys.stderr = f
        
        try:
            print("Starting stateful pipeline run...")
            config = load_pipeline_config()
            existing_ids = get_existing_job_ids(config)
            driver = get_driver()
            
            try:
                # Define all job streams from different sources
                rss_stream = stream_rss_jobs() or []
                foorilla_stream = stream_foorilla_jobs(driver, limit=5) # Increased limit for production

                # Chain all data-yielding streams together
                all_raw_job_streams = itertools.chain(rss_stream, foorilla_stream)

                print("\n--- Scraping and Sending to API ---")
                for raw_job in all_raw_job_streams:
                    job_id = generate_job_id(raw_job)
                    if job_id in existing_ids:
                        print(f"  > Skipping duplicate job '{raw_job.get('title')}'")
                        continue
                    
                    print(f"  > Processing new job '{raw_job.get('title')}'...")
                    # Add the generated ID to the job data before sending
                    raw_job['id'] = job_id
                    send_to_ingest_api(raw_job, config)
                    time.sleep(1) # Add a small delay to be respectful to our own API

                print("\nPipeline finished successfully.")

            except Exception as e:
                print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
                # No sys.exit(1) in the log file version
            finally:
                print("Shutting down browser driver...")
                if driver:
                    driver.quit()
        finally:
            # Restore stdout and stderr
            sys.stdout = original_stdout
            sys.stderr = original_stderr
    
    # Print a final confirmation to the actual console
    print(f"Pipeline dry run complete. Output logged to {LOG_FILE}")

if __name__ == "__main__":
    # Re-pasting the full functions here since they were placeholders above
    def stream_rss_jobs(config_path='src/pipeline/config/rss_config.json'):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            print(f"Warning: RSS config file not found at {config_path}", file=sys.stderr)
            return
        feeds = config.get('RSS_FEEDS', [])
        if not feeds: return
        print("Processing RSS feeds...")
        for url in feeds:
            print(f"  - Fetching RSS from {url}")
            feed = feedparser.parse(url)
            for entry in feed.entries:
                yield {
                    'source': feed.feed.title if hasattr(feed.feed, 'title') else url,
                    'title': entry.title,
                    'company': entry.get('author', 'N/A'),
                    'link': entry.link,
                    'summary': entry.summary,
                    'description': entry.summary,
                    'postedDate': entry.get('published')
                }

    def stream_foorilla_jobs(driver: webdriver.Firefox, limit: int = 1):
        print("Processing foorilla.com...")
        main_url = "https://foorilla.com/"
        try:
            print(f"  - Navigating to {main_url}")
            driver.get(main_url)
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.list-group-item")))
            soup = BeautifulSoup(driver.page_source, 'lxml')
            job_links = []
            job_items = soup.select('li.list-group-item')
            print(f"  - Found {len(job_items)} potential job items on the main page.")
            for item in job_items:
                if len(job_links) >= limit: break
                link_element = item.select_one('a.stretched-link')
                if not link_element: continue
                title = link_element.get_text(strip=True)
                if any(n.lower() in title.lower() for n in ["AI", "Machine Learning", "Data Scientist"]):
                    href = link_element.get('hx-get')
                    if href:
                        full_link = f"https://foorilla.com{href}"
                        job_links.append({'title': title, 'url': full_link})
                        print(f"    - Found relevant job link: '{title}'")
            del soup
            print(f"  - Scraping details for {len(job_links)} jobs...")
            for job_info in job_links:
                try:
                    print(f"    - Scraping {job_info['url']}")
                    driver.get(job_info['url'])
                    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "mc_2")))
                    detail_soup = BeautifulSoup(driver.page_source, 'lxml')
                    main_content = detail_soup.select_one('#mc_2')
                    if not main_content: continue
                    title = main_content.find('h1').get_text(strip=True) if main_content.find('h1') else job_info['title']
                    company_tag = main_content.find(lambda tag: tag.name == 'strong' and '@' in tag.text)
                    company = company_tag.get_text(strip=True).replace('@', '').strip() if company_tag else 'N/A'
                    location = 'N/A'
                    if company_tag and company_tag.parent:
                        location_tag = company_tag.parent.find('div', class_=False, recursive=False)
                        if location_tag: location = location_tag.get_text(strip=True)
                    application_link = job_info['url']
                    apply_button = main_content.find('a', class_="btn-primary")
                    if apply_button and apply_button.get('href'):
                        internal_apply_url = f"https://foorilla.com{apply_button['href']}"
                        application_link = resolve_application_link(driver, internal_apply_url)
                        driver.get(job_info['url'])
                        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, "mc_2")))
                    yield {
                        'source': 'foorilla.com',
                        'title': title,
                        'company': company,
                        'location': location,
                        'link': application_link,
                        'description': str(main_content),
                        'postedDate': '',
                        'salaryRange': None,
                        'jobLevel': None,
                        'employeeRole': None
                    }
                    del detail_soup
                    time.sleep(2)
                except Exception as e:
                    print(f"      Error scraping detail page {job_info['url']}: {e}", file=sys.stderr)
                    continue
        except Exception as e:
            print(f"An error occurred during foorilla.com scraping: {e}", file=sys.stderr)

    main()
