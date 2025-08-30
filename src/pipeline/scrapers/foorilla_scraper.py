import json
import sys
import time
import os
import re
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from urllib.parse import urlparse, urljoin
from datetime import datetime, timedelta

# --- Helper Functions ---

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
        return internal_apply_url # Return the internal URL if resolution fails

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

# --- Extraction Functions ---

def extract_posted_date(soup: BeautifulSoup) -> str | None:
    """Extracts the posted date from the job detail page."""
    date_elements = soup.find_all(text=re.compile(r'(Posted|Published|Date Posted|Application Deadline)', re.IGNORECASE))
    for elem in date_elements:
        # Look for date patterns in the element's text or its parent's text
        text_to_parse = elem.strip() + (elem.find_next_sibling().get_text(strip=True) if elem.find_next_sibling() else '')
        
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

def extract_salary_range(soup: BeautifulSoup) -> str | None:
    """Extracts the salary range from the job detail page."""
    # Look for elements that might contain salary info
    salary_elements = soup.find_all(text=re.compile(r'(salary|compensation|pay|wage)', re.IGNORECASE))
    for elem in salary_elements:
        # Look for common salary patterns in the element's text or its parent's text
        text_to_parse = elem.strip() + (elem.find_next_sibling().get_text(strip=True) if elem.find_next_sibling() else '')
        
        patterns = [
            r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|to)?\s*\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per year|p\.a\.|/yr|annually)?', # $XX,XXX - $YY,YYY
            r'\d{1,3}(?:,\d{3})*\s*(?:k|K)?\s*(?:-|to)?\s*\d{1,3}(?:,\d{3})*\s*(?:k|K)?\s*(?:per year|p\.a\.|/yr|annually)?', # XXk - YYk
            r'(competitive|negotiable|based on experience)', # Keywords
        ]
        for pattern in patterns:
            match = re.search(pattern, text_to_parse, re.IGNORECASE)
            if match:
                return match.group(0).strip()
    return None

def extract_job_level(soup: BeautifulSoup) -> str | None:
    """Extracts the job level (e.g., Senior, Junior) from the job detail page."""
    levels = ['Junior', 'Entry-Level', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Principal', 'Staff', 'Manager', 'Director', 'VP']
    # Search for these keywords in common places like headings, strong tags, or list items
    for tag in soup.find_all(['h1', 'h2', 'h3', 'strong', 'li', 'p']):
        text = tag.get_text(strip=True)
        for level in levels:
            if re.search(r'\b' + re.escape(level) + r'\b', text, re.IGNORECASE):
                return level
    return None

def extract_employee_role(soup: BeautifulSoup) -> str | None:
    """Extracts the employee role (e.g., Full-time, Contract) from the job detail page."""
    roles = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance', 'Permanent']
    # Search for these keywords in common places
    for tag in soup.find_all(['h1', 'h2', 'h3', 'strong', 'li', 'p']):
        text = tag.get_text(strip=True)
        for role in roles:
            if re.search(r'\b' + re.escape(role) + r'\b', text, re.IGNORECASE):
                return role
    return None

# --- Main Stream Function ---

def stream_foorilla_jobs(driver: webdriver.Firefox, limit: int = 1):
    """
    A generator function that scrapes jobs from Foorilla and yields them one by one.
    """
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
                    'postedDate': extract_posted_date(detail_soup),
                    'salaryRange': extract_salary_range(detail_soup),
                    'jobLevel': extract_job_level(detail_soup),
                    'employeeRole': extract_employee_role(detail_soup)
                }
                del detail_soup
                time.sleep(2)
            except Exception as e:
                print(f"      Error scraping detail page {job_info['url']}: {e}", file=sys.stderr)
                continue
    except Exception as e:
        print(f"An error occurred during foorilla.com scraping: {e}", file=sys.stderr)