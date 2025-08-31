# mypy: disable-error-code=attr-defined
import argparse
import sys
import json
import re
import time
import os
from bs4 import BeautifulSoup, NavigableString, Tag
from typing import cast, TypedDict, List, Optional

class JobDetails(TypedDict, total=False):
    title: str
    company: str
    location: str
    description: str
    responsibilities: List[str]
    qualifications: List[str]
    jobLevel: str
    employeeRole: str
    salaryRange: str
    tags: List[str]
    postedDate: str
    expirationDate: str
    applicationLink: str
from playwright.sync_api import sync_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError # Updated import
from datetime import datetime, timedelta
from urllib.parse import urlparse
from .utils import get_driver, resolve_application_link, close_driver # Updated import

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

def fetch_page_html(page: Page, url: str) -> str: # Changed driver to page
    """Fetches the HTML content of a given URL using Playwright."""
    print(f"DEBUG: Fetching HTML from {url}...")
    try:
        page.goto(url, wait_until="domcontentloaded") # Use page.goto
        # Playwright automatically waits for page to load, but we can add more specific waits if needed
        # For now, a simple wait_until="domcontentloaded" should suffice
        print("DEBUG: Playwright page loaded.")
        return page.content() # Use page.content()
    except PlaywrightTimeoutError as e: # Updated exception
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

def scrape_job_details(page: Page, html_content: str, config: dict) -> JobDetails: # Changed driver to page
    """Parses the job detail page HTML to extract comprehensive data."""
    soup = BeautifulSoup(html_content, 'lxml')
    details: JobDetails = {}
    selectors = config.get("job_detail_selectors", {})

    main_content = soup.select_one(selectors.get("description_container"))
    if not main_content:
        print(f"DEBUG: description_container 'f{selectors.get('description_container')}' not found.", file=sys.stderr)
        return {}
    print(f"DEBUG: main_content found. Length: {len(str(main_content))}", file=sys.stderr)

    title_element = main_content.select_one(selectors.get("title"))
    details['title'] = title_element.get_text(strip=True) if title_element else "N/A"
    print(f"DEBUG: Title: {details['title']}", file=sys.stderr)
    
    company_element = main_content.select_one(selectors.get("company"))
    if company_element:
        company_text = company_element.get_text(strip=True)
        details['company'] = company_text.replace('@', '').strip()
    else:
        details['company'] = "N/A"

    location_element = main_content.select_one(selectors.get("location"))
    details['location'] = location_element.get_text(strip=True) if location_element else "N/A"

    description_parts = []
    responsibilities = []
    qualifications = []
    tags = []
    job_level = "N/A"
    employee_role = "N/A"
    salary_range = "N/A"

    # Improved Salary Extraction using configurable selector or patterns
    salary_selector = selectors.get("salary_selector")
    if salary_selector:
        salary_element = main_content.select_one(salary_selector)
        if salary_element:
            salary_range = salary_element.get_text(strip=True)
    if salary_range == "N/A": # Fallback to patterns if selector fails or is not provided
        salary_patterns = [
            r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*-\s*\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
            r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per year|p.a.|/yr|annually)',
            r'\d{1,3}(?:,\d{3})*\s*-\s*\d{1,3}(?:,\d{3})*\s*(?:k|K)?',
            r'\d{1,3}(?:,\d{3})*\s*(?:k|K)?\s*(?:per year|p.a.|/yr|annually)',
        ]
        for pattern in salary_patterns:
            match = re.search(pattern, main_content.get_text(), re.IGNORECASE)
            if match:
                salary_range = match.group(0)
                break

    # Extract Job Level and Employee Role
    for strong_tag in main_content.find_all('strong'):
        text = strong_tag.get_text(strip=True)
        if "Job Level:" in text:
            next_sibling = strong_tag.find_next_sibling()
            if next_sibling:
                job_level = next_sibling.get_text(strip=True)
        elif "Employee Role:" in text:
            next_sibling = strong_tag.find_next_sibling()
            if next_sibling:
                employee_role = next_sibling.get_text(strip=True)

    # Extract Responsibilities
    resp_heading_selector = selectors.get("responsibilities_heading")
    if resp_heading_selector:
        tasks_heading = main_content.select_one(resp_heading_selector)
        if tasks_heading:
            ul_element = tasks_heading.find_next_sibling('ul')
            if ul_element:
                for li in ul_element.find_all('li'):
                    responsibilities.append(li.get_text(strip=True).replace('*', '').strip())

    # Extract Qualifications
    qual_heading_selector = selectors.get("qualifications_heading")
    if qual_heading_selector:
        skills_heading = main_content.select_one(qual_heading_selector)
        if skills_heading:
            div_element = skills_heading.find_next_sibling('div')
            if div_element:
                skills_text = div_element.get_text(strip=True)
                extracted_skills = [s.strip() for s in skills_text.replace('[', '').replace(']', '').split('][') if s.strip()]
                qualifications.extend(extracted_skills)
                tags.extend(extracted_skills)

    # Improved Description Extraction
    if main_content:
        if isinstance(main_content, Tag):
            # Create a new BeautifulSoup object from the tag's HTML to ensure find_all is available
            # This is a workaround for mypy's strictness with Tag types
            temp_soup = BeautifulSoup(str(main_content), 'lxml')
            for element in temp_soup.find_all(['p', 'ul', 'h2', 'h3']):
                if isinstance(element, Tag):
                    # Avoid re-adding responsibilities and qualifications
                    parent_ul = element.find_parent('ul')
                    if parent_ul and parent_ul.previous_sibling:
                        prev_sibling_text = parent_ul.previous_sibling.get_text()
                        if (selectors.get("responsibilities_heading") in prev_sibling_text or selectors.get("qualifications_heading") in prev_sibling_text):
                            continue
                    description_parts.append(str(element))
                # Avoid re-adding responsibilities and qualifications
                parent_ul = element.find_parent('ul')
                if parent_ul and parent_ul.previous_sibling:
                    prev_sibling_text = parent_ul.previous_sibling.get_text()
                    if (selectors.get("responsibilities_heading") in prev_sibling_text or selectors.get("qualifications_heading") in prev_sibling_text):
                        continue
                description_parts.append(str(element))

    full_description_html = "".join(description_parts)

    details['description'] = full_description_html if full_description_html else "<p>No detailed description provided.</p>"
    details['responsibilities'] = responsibilities
    details['qualifications'] = qualifications
    details['jobLevel'] = job_level
    details['employeeRole'] = employee_role
    details['salaryRange'] = salary_range
    details['tags'] = tags
    
    # Implement actual date extraction from HTML
    posted_date_str = extract_posted_date(soup)
    details['postedDate'] = posted_date_str if posted_date_str else datetime.now().isoformat() + 'Z'
    
    # For expirationDate, if not found, default to 30 days from postedDate
    # This is a heuristic and might need more sophisticated logic based on site
    if posted_date_str:
        posted_dt = datetime.strptime(posted_date_str.replace('Z', ''), "%Y-%m-%dT%H:%M:%S.%f")
        details['expirationDate'] = (posted_dt + timedelta(days=30)).isoformat() + 'Z'
    else:
        details['expirationDate'] = (datetime.now() + timedelta(days=30)).isoformat() + 'Z'

    apply_button_selector = selectors.get("apply_button_selector")
    if apply_button_selector:
        apply_button = main_content.select_one(apply_button_selector)
        if apply_button and apply_button.get('href'):
            # Properly join the URL
            base_url = urlparse(str(config.get("start_url")))._replace(path='').geturl()
            internal_apply_url = f"{base_url}{apply_button['href']}"
            resolved_application_link = resolve_application_link(page, internal_apply_url) # Changed driver to page
            details['applicationLink'] = resolved_application_link

            # Only attempt to extract company from application link if not already found
            if details['company'] == "N/A": # Check if company was not found by primary method
                try:
                    parsed_url = urlparse(resolved_application_link)
                    domain = parsed_url.netloc
                    if "smartrecruiters.com" in domain:
                        path_parts = parsed_url.path.split('/')
                        if len(path_parts) > 1 and path_parts[1]:
                            details['company'] = path_parts[1].replace('-', ' ').title()
                        else:
                            details['company'] = "SmartRecruiters"
                    elif "jobs.lever.co" in domain:
                        details['company'] = domain.split('.')[0].replace('-', ' ').title()
                    elif "boards.greenhouse.io" in domain:
                        details['company'] = domain.split('.')[0].replace('-', ' ').title()
                    else:
                        company_name = domain.replace('www.', '').split('.')[0]
                        details['company'] = company_name.replace('-', ' ').title()
                except Exception as e:
                    print(f"Error parsing company from application link: {e}", file=sys.stderr)
                    pass # Do not overwrite if an error occurs, keep existing value
        else: # If apply_button or href is missing, but apply_button_selector exists
            details['applicationLink'] = "#"
            if details['company'] == "N/A": # If company was not found by primary method
                details['company'] = "N/A"
    else: # If apply_button_selector is not provided in config
        details['applicationLink'] = "#"
        if details['company'] == "N/A": # If company was not found by primary method
            details['company'] = "N/A"

    return details

def save_as_json(jobs_data: list, filename: str):
    """Saves the extracted job data to a JSON file in the output directory."""
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    print(f"Saving {len(jobs_data)} jobs to {filepath}...")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(jobs_data, f, indent=2)
    print(f"Successfully saved jobs to {filepath}")

# --- Main Execution ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Intelligently scrape job data and format for seeding.")
    parser.add_argument("--config", type=str, required=True, help="Path to the site-specific JSON configuration file.")
    parser.add_argument("--limit", type=int, default=3, help="The maximum number of relevant jobs to scrape.")
    args = parser.parse_args()

    config = load_config(args.config)
    start_url = config.get("start_url")

    if not start_url:
        print("Error: Configuration file must contain a 'start_url'.", file=sys.stderr)
        sys.exit(1)

    with sync_playwright() as p: # Use Playwright context manager
        browser = get_driver() # Get the Playwright browser instance
        page = browser.new_page() # Create a new page

        main_page_html = fetch_page_html(page, start_url) # Pass page instead of driver

        if not main_page_html:
            print("Failed to fetch main job page. Exiting.", file=sys.stderr)
            close_driver() # Close Playwright browser
            sys.exit(1)

        # Save the successfully fetched main page HTML for inspection
        save_html_to_file(main_page_html, filename_base="foorilla_main_page_success", identifier="jobs_page")

        relevant_jobs_to_scrape = scrape_job_links(main_page_html, args.limit, config)
        
        if not relevant_jobs_to_scrape:
            print("No relevant job links found on the main page.", file=sys.stderr)
            close_driver() # Close Playwright browser
            sys.exit(1)

        all_job_details = []
        for job_info in relevant_jobs_to_scrape:
            print(f"--- Scraping details for: {job_info['title']} ---")
            # Pass the page to scrape_job_details for resolving the application link
            detail_page_html = fetch_page_html(page, job_info['url']) # Pass page instead of driver
            if detail_page_html:
                details = scrape_job_details(page, detail_page_html, config) # Pass page and config here
                if details:
                    all_job_details.append(details)
            time.sleep(2) # Keep a small delay to avoid overwhelming the server

        close_driver() # Close Playwright browser

        if all_job_details:
            save_as_json(all_job_details, "scraped_jobs.json")
        else:
            print("\nNo job details could be extracted.", file=sys.stderr)




