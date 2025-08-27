import json
import feedparser
import sys
import itertools
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException

# --- Helper Functions ---

def get_driver() -> webdriver.Firefox:
    """Initializes and returns a Selenium Firefox driver for Termux."""
    print("Initializing headless Firefox driver...")
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Path for geckodriver in Termux
    service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
    try:
        driver = webdriver.Firefox(service=service, options=options)
        return driver
    except WebDriverException as e:
        print(f"Error initializing Firefox driver: {e}", file=sys.stderr)
        print("Please ensure geckodriver is installed and accessible.", file=sys.stderr)
        sys.exit(1)

# --- Streamer for RSS Feeds ---

def stream_rss_jobs(config_path='src/pipeline/config/rss_config.json'):
    """Reads RSS feeds and yields each job entry."""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Warning: RSS config file not found at {config_path}", file=sys.stderr)
        return

    feeds = config.get('RSS_FEEDS', [])
    if not feeds:
        print("No RSS feeds found in config file.")
        return

    print("Processing RSS feeds...")
    for url in feeds:
        print(f"  - Fetching RSS from {url}")
        feed = feedparser.parse(url)
        for entry in feed.entries:
            yield {
                'source': 'RSS',
                'title': entry.title,
                'link': entry.link,
                'summary': entry.summary,
                'published': entry.get('published')
            }

# --- Streamer for Hiring.cafe ---

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
            print(f"SEARCH_QUERY::{json.dumps(search_query)}")

    except Exception as e:
        print(f"An error occurred during hiring.cafe scraping: {e}", file=sys.stderr)


# --- Streamer for Foorilla.com ---

def stream_foorilla_jobs(driver: webdriver.Firefox, limit: int = 5):
    """Scrapes foorilla.com and yields each job entry."""
    print("Processing foorilla.com...")
    main_url = "https://foorilla.com/" # Corrected start URL
    
    try:
        print(f"  - Navigating to {main_url}")
        driver.get(main_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.list-group-item")))

        soup = BeautifulSoup(driver.page_source, 'lxml')
        
        job_links = []
        job_items = soup.select('li.list-group-item')
        print(f"  - Found {len(job_items)} potential job items on the main page.")

        for item in job_items:
            if len(job_links) >= limit:
                break
            link_element = item.select_one('a.stretched-link')
            if not link_element:
                continue
            
            title = link_element.get_text(strip=True)
            if any(n.lower() in title.lower() for n in ["AI", "Machine Learning", "Data Scientist", "AI Engineer", "AI Video Editor", "AI Content Creator", "AI Prompt Engineer", "Vibe Coder"]):
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
                WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "#mc_2 h1")))
                
                detail_soup = BeautifulSoup(driver.page_source, 'lxml')
                main_content = detail_soup.select_one('#mc_2')
                if not main_content: continue

                title = main_content.select_one('h1').get_text(strip=True) if main_content.select_one('h1') else job_info['title']
                
                # Improved company extraction
                company_element = main_content.select_one('div.hstack.justify-content-between > div:nth-of-type(2) > strong')
                company = "N/A"
                if company_element:
                    company_text = company_element.get_text(strip=True).replace('@', '').strip()
                    if company_text == "...": # If company is still '...', set to N/A
                        company = "N/A"
                    else:
                        company = company_text

                # Improved location extraction
                location_div = main_content.select_one('div.hstack.justify-content-between > div:not([class])')
                location = location_div.get_text(strip=True) if location_div else "N/A"

                description_parts = []
                responsibilities = []
                qualifications = []
                tags = []

                tasks_heading = main_content.find('strong', string='Tasks:')
                if tasks_heading and tasks_heading.find_next_sibling('ul'):
                    description_parts.append("<h4>Responsibilities</h4><ul>")
                    for li in tasks_heading.find_next_sibling('ul').find_all('li'):
                        text = li.get_text(strip=True)
                        responsibilities.append(text)
                        description_parts.append(f"<li>{text}</li>")
                    description_parts.append("</ul>")

                skills_heading = main_content.find('strong', string='Skills/Tech-stack required:')
                if skills_heading and skills_heading.find_next_sibling('div'):
                    description_parts.append("<h4>Qualifications</h4>")
                    skills_text = skills_heading.find_next_sibling('div').get_text(strip=True)
                    tags = [s.strip() for s in skills_text.replace('[', '').split(']') if s.strip()]
                    description_parts.append("<ul>")
                    for tag in tags:
                        qualifications.append(tag)
                        description_parts.append(f"<li>{tag}</li>")
                    description_parts.append("</ul>")

                yield {
                    'source': 'foorilla.com',
                    'title': title,
                    'company': (main_content.select_one('div.hstack.justify-content-between > div:nth-of-type(2) > strong').get_text(strip=True).replace('@', '').strip() if main_content.select_one('div.hstack.justify-content-between > div:nth-of-type(2) > strong') else 'N/A'),
                    'link': job_info['url'],
                    'summary': "".join(description_parts),
                    'published': '',
                    'tags': tags,
                    'responsibilities': responsibilities,
                    'qualifications': qualifications
                }
                del detail_soup
                time.sleep(2)
            except Exception as e:
                print(f"      Error scraping detail page {job_info['url']}: {e}", file=sys.stderr)
                continue
    except Exception as e:
        print(f"An error occurred during foorilla.com scraping: {e}", file=sys.stderr)


# --- Main Pipeline Orchestrator ---

def main():
    """Main function to orchestrate the entire data pipeline."""
    output_filename = 'src/pipeline/output/final_jobs.json'
    print(f"Starting pipeline. Output will be saved to {output_filename}")

    driver = get_driver()
    job_count = 0
    
    try:
        # Define all the job streams from different sources
        rss_stream = stream_rss_jobs()
        stream_hiring_cafe_jobs(driver) # This function will now print to stdout
        foorilla_stream = stream_foorilla_jobs(driver)

        # Chain all streams together into a single, efficient iterator
        all_streams = itertools.chain(rss_stream, foorilla_stream)

        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write('[')
            is_first_item = True
            for job in all_streams:
                if not is_first_item:
                    f.write(',\n')
                
                json.dump(job, f, indent=4)
                is_first_item = False
                job_count += 1
            f.write('\n]')
        
        print(f"\nPipeline finished successfully. Processed {job_count} total jobs.")
        print(f"Data saved to {output_filename}")

    except Exception as e:
        print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        print("Shutting down browser driver...")
        if driver:
            driver.quit()



if __name__ == "__main__":
    main()
