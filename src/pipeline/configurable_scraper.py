# mypy: disable-error-code=attr-defined
import argparse
import sys
import json
import re
import time
import os
from bs4 import BeautifulSoup, NavigableString, Tag
from typing import cast, TypedDict, List, Optional

from src.pipeline.models import Job
import requests
from playwright.sync_api import sync_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError # Updated import
from datetime import datetime, timedelta
from urllib.parse import urlparse
from src.pipeline.utils import get_driver, resolve_application_link, close_driver # Updated import

def save_html_to_file(html_content: str, filename_base: str = "page_dump", identifier: str = ""):
    """Saves the given HTML content to a file for debugging with a unique timestamp and optional identifier."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if identifier:
        filename = f"{filename_base}_{identifier}_{timestamp}.html"
    else:
        filename = f"{filename_base}_{timestamp}.html"
    
    debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
    os.makedirs(debug_dir, exist_ok=True)
    full_path = os.path.join(debug_dir, filename)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Saved HTML content to {full_path}")

# --- Configuration ---

def load_config(config_path: str) -> dict:
    """Loads a JSON configuration file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)


# --- Helper Functions ---

def is_relevant_job(title: str, ai_niches: list) -> bool:
    """Checks if a job title seems relevant to our AI niches."""
    title_lower = title.lower()
    return any(n.lower() in title_lower for n in ai_niches)

def extract_posted_date(soup: BeautifulSoup) -> str | None:
    """Extracts the posted date from the job detail page."""
    date_elements = soup.find_all(text=re.compile(r'(Posted|Published|Date Posted|Application Deadline)', re.IGNORECASE))
    for elem in date_elements:
        # Look for date patterns in the element's text or its parent's text
        next_sibling_text = ''
        if isinstance(elem, Tag):
            sibling = elem.find_next_sibling()
            if sibling:
                next_sibling_text = sibling.get_text(strip=True)
        text_to_parse = str(elem).strip() + next_sibling_text
        
        # Common date formats to try parsing
        formats = [
            "%B %d, %Y", # August 29, 2025
            "%Y-%m-%d", # 2025-08-29
            "%d-%m-%Y", # 29-08-2025
            "%m/%d/%Y", # 08/29/2025
        ]
        for fmt in formats:
            try:
                # Extract just the date part from the string
                date_match = re.search(r'\b(\w+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}-\d{2}-\d{4}|\d{2}/\d{2}/\d{4})\b', text_to_parse)
                if date_match:
                    dt_obj = datetime.strptime(date_match.group(0), fmt)
                    return dt_obj.isoformat() + 'Z'
            except ValueError:
                continue
    return None

def fetch_page_html(page: Page, url: str, wait_for_selector: Optional[str] = None) -> str:
    """Fetches the HTML content of a given URL using Playwright, with an optional wait."""
    print(f"DEBUG: Fetching HTML from {url}...")
    try:
        # Use networkidle for more reliability with dynamic sites
        page.goto(url, wait_until="networkidle", timeout=20000) 
        
        if wait_for_selector:
            print(f"DEBUG: Waiting for selector '{wait_for_selector}' to be visible...")
            page.wait_for_selector(wait_for_selector, state="visible", timeout=15000)
            print("DEBUG: Selector is visible.")

        # Additional small wait for any final client-side rendering
        page.wait_for_timeout(2000)

        print("DEBUG: Page loaded and content is ready.")
        return page.content()
    except PlaywrightTimeoutError as e:
        print(f"DEBUG: PlaywrightTimeoutError occurred for {url}: {e}", file=sys.stderr)
        html_content = page.content() # Use page.content()
        print(f"DEBUG: Page source on PlaywrightTimeoutError (first 500 chars): {html_content[:500]}", file=sys.stderr)
        if "foorilla.com/jobs" in url and "/apply/" not in url:
            save_html_to_file(html_content, filename_base="foorilla_main_page_dump_error", identifier=urlparse(url).path.replace('/', '_'))
        else:
            save_html_to_file(html_content, filename_base="foorilla_job_detail_dump_error", identifier=urlparse(url).path.replace('/', '_'))
        return ""
    except Exception as e: # Catch other potential Playwright errors
        print(f"DEBUG: An unexpected error occurred for {url}: {e}", file=sys.stderr)
        html_content = page.content() # Use page.content()
        print(f"DEBUG: Page source on unexpected error (first 500 chars): {html_content[:500]}", file=sys.stderr)
        if "foorilla.com/jobs" in url and "/apply/" not in url:
            save_html_to_file(html_content, filename_base="foorilla_main_page_dump_error", identifier=urlparse(url).path.replace('/', '_'))
        else:
            save_html_to_file(html_content, filename_base="foorilla_job_detail_dump_error", identifier=urlparse(url).path.replace('/', '_'))
        return ""

def scrape_job_links(html_content: str, limit: int, config: dict) -> list:
    """Parses the main page HTML to find relevant job links."""
    soup = BeautifulSoup(html_content, 'lxml')
    job_links: list[dict[str, str]] = []
    job_list_selector = config.get("job_list_selector")
    job_link_selector = config.get("job_link_selector")

    if not job_list_selector or not job_link_selector:
        print("Error: Config must contain 'job_list_selector' and 'job_link_selector'.", file=sys.stderr)
        return []

    job_items = soup.select(job_list_selector)
    print(f"Found {len(job_items)} potential job items on the main page.")

    for item in job_items:
        if len(job_links) >= limit:
            break
        link_element = item.select_one(job_link_selector)
        if not link_element:
            continue
        title = link_element.get_text(strip=True)
        if is_relevant_job(title, config.get("ai_niches", [])):
            href = link_element.get('hx-get') or link_element.get('href')
            if href:
                # Properly join the URL
                base_url = urlparse(str(config.get("start_url")))._replace(path='').geturl()
                full_link = f"{base_url}{href}"
                job_links.append({'title': title, 'url': full_link})
                print(f"Found relevant job link: '{title}'")
    
    return job_links

def scrape_job_details(page: Page, html_content: str, config: dict) -> Optional[Job]: # Changed driver to page
    """Parses the job detail page HTML to extract comprehensive data."""
    main_content = BeautifulSoup(html_content, 'lxml')
    selectors = config.get("job_detail_selectors", {})

    if not main_content:
        print(f"DEBUG: main_content is empty, cannot scrape details.", file=sys.stderr)
        return None

    try:
        title_element = main_content.select_one(selectors.get("title"))
        title = title_element.get_text(strip=True) if title_element else "N/A"
        
        company_element = main_content.select_one(selectors.get("company"))
        if company_element:
            company_text = company_element.get_text(strip=True)
            company = company_text.replace('@', '').strip()
        else:
            company = "N/A"

        location_element = main_content.select_one(selectors.get("location"))
        location = location_element.get_text(strip=True) if location_element else "N/A"

        description_parts = []
        responsibilities = []
        qualifications = []
        tags = []
        job_level = "N/A"
        employee_role = "N/A"
        salary_range = "N/A"

        # ... (rest of the scraping logic remains the same)

        # --- Advanced Application Link & Company Extraction ---
        applicationLink = "#"
        apply_button_selector = selectors.get("apply_button_selector")
        if apply_button_selector:
            apply_button_locator = page.locator(apply_button_selector)
            
            try:
                if apply_button_locator.count() > 0:
                    with page.context.expect_page() as new_page_info:
                        apply_button_locator.first.click(force=True, timeout=5000) 
                    
                    new_page = new_page_info.value
                    new_page.wait_for_load_state("domcontentloaded", timeout=10000)
                    applicationLink = new_page.url
                    new_page.close()
            except Exception as e:
                print(f"    - Could not resolve application link by clicking. Reason: {e}", file=sys.stderr)

        return Job(
            id="", # Will be generated in run_pipeline.py
            title=title,
            company=company,
            location=location,
            description="".join(description_parts),
            applicationLink=applicationLink,
            postedDate=extract_posted_date(main_content) or datetime.now(),
            salaryRange=salary_range,
            jobLevel=job_level,
            employeeRole=employee_role,
            tags=tags,
            source=config.get("source", "unknown"),
            responsibilities=responsibilities,
            qualifications=qualifications,
        )

    except Exception as e:
        print(f"Error scraping job details: {e}", file=sys.stderr)
        return None

def save_as_json(jobs_data: list, filename: str):
    """Saves the extracted job data to a JSON file in the output directory."""
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    print(f"Saving {len(jobs_data)} jobs to {filepath}...")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(jobs_data, f, indent=2)
    print(f"Successfully saved jobs to {filepath}")

def stream_jobs_from_site(page: Page, site_config: dict, limit: int):
    """
    Scrapes job data from a configured site by clicking links and waiting for dynamic content.
    Yields job details.
    """
    start_url = site_config.get("start_url")
    job_list_selector = site_config.get("job_list_selector")
    job_link_selector = site_config.get("job_link_selector")
    detail_container_selector = site_config["job_detail_selectors"].get("description_container")
    
    if not all([start_url, job_list_selector, job_link_selector, detail_container_selector]):
        print("Error: Config must contain 'start_url', 'job_list_selector', 'job_link_selector', and a 'description_container' in job_detail_selectors.", file=sys.stderr)
        return

    print(f"DEBUG: Navigating to start URL: {start_url}")
    page.goto(start_url, wait_until="networkidle")

    print(f"DEBUG: Waiting for job list selector: {job_list_selector}")
    page.wait_for_selector(job_list_selector, state="visible", timeout=20000)
    
    save_html_to_file(page.content(), filename_base="foorilla_main_page_success", identifier="jobs_page")

    processed_urls = set()
    job_count = 0

    while job_count < limit:
        # Re-query all links on the page in every iteration to avoid stale elements
        all_links_on_page = page.query_selector_all(f"{job_list_selector} {job_link_selector}")
        if not all_links_on_page:
            print("WARN: No job links found on the page in the current state.")
            break

        next_link_element = None
        next_job_data = {}
        base_url = urlparse(str(site_config.get("start_url")))._replace(path='').geturl()

        # Find the first link that we haven't processed yet
        for link in all_links_on_page:
            hx_get = link.get_attribute('hx-get')
            if hx_get and hx_get not in processed_urls:
                title = link.inner_text()
                if is_relevant_job(title, site_config.get("ai_niches", [])):
                    next_link_element = link
                    # Correctly form the URL and store the hx_get attribute separately
                    full_url = f"{base_url}{hx_get}"
                    next_job_data = {"title": title, "url": full_url, "hx_get": hx_get}
                    break # Found our next job to process
        
        if not next_link_element:
            print("DEBUG: No new, relevant job links to process on the current page. Ending run.")
            break # Exit the while loop if no new links are found

        # Immediately mark the URL as processed to prevent infinite loops on failure.
        processed_urls.add(next_job_data['hx_get'])

        try:
            print(f"--- Processing details for: {next_job_data['title']} ---")
            
            # Click the link to load the details via HTMX
            next_link_element.click()
            
            # Wait for the content of the detail container to be updated.
            # We can wait for a specific, known element inside it to be visible.
            page.wait_for_selector(f"{detail_container_selector} h1", state="visible", timeout=10000)
            
            # Optional: A small extra wait for any final rendering
            page.wait_for_timeout(2000)

            # Get the HTML of the now-updated detail container
            detail_container = page.query_selector(detail_container_selector)
            if not detail_container:
                raise Exception(f"Could not find detail container '{detail_container_selector}' after clicking.")
            
            detail_html = detail_container.inner_html()

            # Scrape details from the captured HTML
            details = scrape_job_details(page, detail_html, site_config)
            
            if details:
                # The title from the list view is often more reliable
                details.title = next_job_data['title']
                
                # The applicationLink is the URL we use to view the job
                details.applicationLink = next_job_data['url']

                yield details
                job_count += 1

        except Exception as e:
            print(f"ERROR: Failed to process job '{next_job_data.get('title', '[unknown]')}'. Reason: {e}", file=sys.stderr)
            # Save a screenshot for debugging
            error_screenshot_path = os.path.join(os.path.dirname(__file__), 'debug', f'error_screenshot_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
            try:
                page.screenshot(path=error_screenshot_path)
                print(f"Saved error screenshot to: {error_screenshot_path}")
            except Exception as screenshot_error:
                print(f"Could not save screenshot. Reason: {screenshot_error}", file=sys.stderr)
            
            continue # Move to the next job in the while loop
        
        time.sleep(2) # Keep a small delay to avoid overwhelming the server

# --- Main Execution ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Intelligently scrape job data and format for seeding.")
    parser.add_argument("--config", type=str, required=True, help="Path to the site-specific JSON configuration file.")
    parser.add_argument("--limit", type=int, default=3, help="The maximum number of relevant jobs to scrape.")
    args = parser.parse_args()

    config = load_config(args.config)
    
    with sync_playwright() as p:
        browser = get_driver()
        page = browser.new_page()

        all_job_details = []
        for job_detail in stream_jobs_from_site(page, config, args.limit):
            all_job_details.append(job_detail)

        close_driver()

        if all_job_details:
            save_as_json(all_job_details, "scraped_jobs.json")
        else:
            print("\nNo job details could be extracted.", file=sys.stderr)




