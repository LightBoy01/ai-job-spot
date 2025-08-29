#!/usr/bin/env python
# src/pipeline/interactive_search.py

import json
import sys
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException

def get_driver() -> webdriver.Firefox:
    """Initializes and returns a Selenium Firefox driver for Termux."""
    print("Initializing headless Firefox driver...")
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
    try:
        driver = webdriver.Firefox(service=service, options=options)
        return driver
    except WebDriverException as e:
        print(f"Error initializing Firefox driver: {e}", file=sys.stderr)
        print("Please ensure geckodriver is installed and accessible.", file=sys.stderr)
        sys.exit(1)

def stream_hiring_cafe_jobs(driver: webdriver.Firefox, limit: int = None):
    """Scrapes hiring.cafe and prints search queries for AI jobs."""
    print("Processing hiring.cafe...")
    main_url = "https://hiring.cafe/"
    
    try:
        print(f"  - Navigating to {main_url}")
        driver.get(main_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.grid")))
        
        soup = BeautifulSoup(driver.page_source, 'lxml')
        
        job_card_elements = list(soup.select("div.grid > div"))
        if limit:
            job_card_elements = job_card_elements[:limit]
            
        print(f"Found {len(job_card_elements)} job cards.")

        for job_element in job_card_elements:
            title_element = job_element.select_one('span.w-full.font-bold.text-start.line-clamp-2')
            title = title_element.get_text(strip=True) if title_element else None

            if not title or not any(keyword.lower() in title.lower() for keyword in ["AI", "Machine Learning", "Data Scientist", "AI Engineer", "Data Engineer"]):
                continue

            company_element = job_element.select_one('img')
            company = company_element['alt'] if company_element and 'alt' in company_element.attrs else "N/A"
            
            search_query = {
                "title": title,
                "company": company
            }
            # This special format is designed to be parsed by an external process
            print(f"SEARCH_QUERY::{json.dumps(search_query)}")

    except Exception as e:
        print(f"An error occurred during hiring.cafe scraping: {e}", file=sys.stderr)

def main():
    """Main function to run the interactive search query generator."""
    driver = get_driver()
    try:
        stream_hiring_cafe_jobs(driver, limit=10) # Default limit for interactive runs
    finally:
        print("Shutting down browser driver...")
        if driver:
            driver.quit()

if __name__ == "__main__":
    main()
