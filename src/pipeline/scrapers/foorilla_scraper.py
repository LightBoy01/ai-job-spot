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
from urllib.parse import urlparse

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

def stream_foorilla_jobs(driver: webdriver.Firefox, limit: int = 1):
    def extract_posted_date(soup: BeautifulSoup) -> str | None:
        date_patterns = [
            re.compile(r'Posted:\s*(.+)', re.IGNORECASE),
            re.compile(r'Date Posted:\s*(.+)', re.IGNORECASE),
            re.compile(r'Published:\s*(.+)', re.IGNORECASE),
        ]
        for tag in soup.find_all(['span', 'div', 'p', 'li']):
            text = tag.get_text(strip=True)
            for pattern in date_patterns:
                match = pattern.search(text)
                if match:
                    try:
                        parsed_date = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.strptime(match.group(1), '%B %d, %Y'))
                        return parsed_date
                    except ValueError:
                        pass
        return None

    def extract_salary_range(soup: BeautifulSoup) -> str | None:
        salary_patterns = [
            re.compile(r'(\$\d{1,3}(?:,\d{3})*(?:-\s*\$\d{1,3}(?:,\d{3})*)?)', re.IGNORECASE),
            re.compile(r'(competitive|negotiable)', re.IGNORECASE),
            re.compile(r'salary:\s*(.+)', re.IGNORECASE),
        ]
        for tag in soup.find_all(['span', 'div', 'p', 'li', 'h2', 'h3']):
            text = tag.get_text(strip=True)
            for pattern in salary_patterns:
                match = pattern.search(text)
                if match:
                    return match.group(1).strip()
            return None

    def extract_job_level(soup: BeautifulSoup) -> str | None:
        levels = ['Junior', 'Entry-Level', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Principal', 'Staff', 'Manager', 'Director', 'VP']
        for tag in soup.find_all(['span', 'div', 'p', 'li', 'h2', 'h3']):
            text = tag.get_text(strip=True)
            for level in levels:
                if level.lower() in text.lower():
                    return level
        return None

    def extract_employee_role(soup: BeautifulSoup) -> str | None:
        roles = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance']
        for tag in soup.find_all(['span', 'div', 'p', 'li', 'h2', 'h3']):
            text = tag.get_text(strip=True)
            for role in roles:
                if role.lower() in text.lower():
                    return role
        return None

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
