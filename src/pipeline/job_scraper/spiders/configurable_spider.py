import scrapy
from scrapy.http import Response
from scrapy_playwright.page import PageMethod
from urllib.parse import urljoin
from job_scraper.items import JobItem
import logging
import os
import re
import json
from datetime import datetime
import dateparser
import bs4

class ConfigurableSpider(scrapy.Spider):
    name = "configurable"
    
    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super(ConfigurableSpider, cls).from_crawler(crawler, *args, **kwargs)
        
        config_str = crawler.settings.get('SPIDER_CONFIG', '{}')
        try:
            spider.settings_dict = json.loads(config_str)
        except json.JSONDecodeError:
            raise ValueError("Failed to decode SPIDER_CONFIG. Please ensure it is valid JSON.")
        
        spider.start_urls = [spider.settings_dict.get('start_url')]
        spider.allowed_domains = spider.settings_dict.get('allowed_domains', [])
        
        spider.job_list_selector = spider.settings_dict.get('job_list_selector')
        spider.job_link_selector = spider.settings_dict.get('job_link_selector')
        spider.job_detail_selectors = spider.settings_dict.get('job_detail_selectors', {})
        
        spider.pagination_config = spider.settings_dict.get('pagination', {})
        spider.max_pages = int(crawler.settings.get('CLOSESPIDER_ITEMCOUNT', 5))
        
        spider.ai_niches = spider.settings_dict.get('ai_niches', [])
        
        spider.debug_dir = crawler.settings.get('DEBUG_OUTPUT_DIR', 'debug_output')
        os.makedirs(spider.debug_dir, exist_ok=True)
        
        if not all([spider.start_urls[0], spider.job_list_selector, spider.job_link_selector]):
            raise ValueError("Missing required spider configuration: start_url, job_list_selector, or job_link_selector")
            
        return spider

    def __init__(self, *args, **kwargs):
        super(ConfigurableSpider, self).__init__(*args, **kwargs)
        self.page_count = 0
        logging.info(f"ConfigurableSpider initialized. Max pages to scrape: {getattr(self, 'max_pages', 'N/A')}")

    def start_requests(self):
        self.log(f"Starting request to {self.start_urls[0]}, using Playwright for the list page.", level=logging.INFO)
        yield scrapy.Request(
            url=self.start_urls[0],
            meta=dict(
                playwright=True,
                playwright_include_page=True,
                playwright_page_methods=[
                    PageMethod("wait_for_selector", self.job_list_selector, state="visible", timeout=20000),
                ],
                errback=self.errback_playwright,
                page_number=1,
            ),
            callback=self.parse_job_list
        )

    async def parse_job_list(self, response: Response):
        page_number = response.meta.get('page_number', 1)
        self.log(f"Successfully fetched job list page: {response.url} (Page {page_number})", level=logging.INFO)
        
        page = response.meta.get("playwright_page")
        if not page:
            self.log("Playwright page not found in meta. Cannot proceed.", level=logging.ERROR)
            return

        link_elements = await page.query_selector_all(f'{self.job_list_selector} {self.job_link_selector}')
        self.log(f"Found {len(link_elements)} potential job links on page {page_number}.", level=logging.INFO)

        job_count = 0
        for link_element in link_elements:
            url_fragment = await link_element.get_attribute('href') or await link_element.get_attribute('hx-get')
            title = await link_element.inner_text()
            
            if url_fragment and self.is_relevant_job(title):
                job_count += 1
                full_url = urljoin(response.url, url_fragment)
                self.log(f"Yielding direct request for relevant job: '{title}' at {full_url}", level=logging.DEBUG)
                
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_job_detail,
                    headers={'HX-Request': 'true'}, # Use direct fetch with HTMX header
                    meta={
                        'job_title': title, 
                        'application_link': full_url
                    }
                )
        
        self.log(f"Finished parsing page {page_number}. Found and yielded {job_count} relevant jobs.", level=logging.INFO)

        if page_number >= self.max_pages:
            self.log(f"Reached max page limit ({self.max_pages}). Stopping pagination.", level=logging.INFO)
            await page.close()
            return

        pagination_type = self.pagination_config.get('type')
        if pagination_type == 'htmx':
            async for r in self.handle_htmx_pagination(page, response, page_number):
                yield r
        else:
            self.log("No pagination configured or type not supported. Stopping.", level=logging.INFO)
            await page.close()

    async def handle_htmx_pagination(self, page, response, page_number):
        selector = self.pagination_config.get('selector')
        if not selector:
            self.log("HTMX pagination selector not configured.", level=logging.ERROR)
            await page.close()
            return
            
        next_page_element = await page.query_selector(selector)
        if next_page_element:
            next_page_url_fragment = await next_page_element.get_attribute('hx-get')
            if next_page_url_fragment:
                next_page_url = urljoin(response.url, next_page_url_fragment)
                self.log(f"Found next page link (HTMX): {next_page_url}", level=logging.INFO)
                
                yield scrapy.Request(
                    url=next_page_url,
                    meta=dict(
                        playwright=True,
                        playwright_include_page=True,
                        playwright_page_methods=[
                            PageMethod("wait_for_selector", self.job_list_selector, state="visible", timeout=20000),
                        ],
                        errback=self.errback_playwright,
                        page_number=page_number + 1,
                    ),
                    callback=self.parse_job_list,
                )
            else:
                self.log("HTMX pagination element found, but no 'hx-get' attribute. Stopping.", level=logging.INFO)
                await page.close()
        else:
            self.log("No more HTMX pagination links found.", level=logging.INFO)
            await page.close()

    def parse_job_detail(self, response: Response):
        self.log(f"Response headers: {response.headers}")
        self.log(f"Response body (first 200 bytes): {response.body[:200]}")
        self.log(f"Parsing job detail from direct HTML partial: {response.url}", level=logging.INFO)
        
        soup = bs4.BeautifulSoup(response.text, 'lxml')
        selectors = self.job_detail_selectors

        def get_text(element):
            return element.get_text(strip=True) if element else None

        title = get_text(soup.select_one(selectors.get('title')))
        company = get_text(soup.select_one(selectors.get('company')))
        location = get_text(soup.select_one(selectors.get('location')))
        salary = get_text(soup.select_one(selectors.get('salary')))
        skills_text = get_text(soup.select_one(selectors.get('skills')))

        tasks = [get_text(li) for li in soup.select(selectors.get('tasks'))]
        perks = [get_text(li) for li in soup.select(selectors.get('perks'))]

        # Extract metadata from its container
        jobLevel = None
        employeeRole = None
        metadata_container = soup.select_one(selectors.get('metadata_container'))
        if metadata_container:
            metadata_text = metadata_container.get_text(separator=' ')
            bracketed_terms = re.findall(r'\[(.*?)\]', metadata_text)
            job_level_keywords = ['entry', 'mid-level', 'senior', 'lead', 'principal', 'intermediate']
            role_keywords = ['full time', 'part time', 'contract', 'internship']
            for term in bracketed_terms:
                term_lower = term.lower()
                if any(keyword in term_lower for keyword in job_level_keywords):
                    jobLevel = term
                if any(keyword in term_lower for keyword in role_keywords):
                    employeeRole = term

        # Create a simple markdown description from the structured data
        tasks_md = '\n'.join([f'- {task}' for task in tasks]) if tasks else 'N/A'
        perks_md = '\n'.join([f'- {perk}' for perk in perks]) if perks else 'N/A'
        skills_md = skills_text if skills_text else 'N/A'

        description = f"""### Tasks
{tasks_md}

### Perks & Benefits
{perks_md}

### Skills
{skills_md}
"""

        job_item = JobItem(
            title=title,
            company=company,
            location=location,
            description=description,
            applicationLink=response.meta.get('application_link'),
            source=self.name,
            postedDate=datetime.now(), # Placeholder, real date parsing can be added back if needed
            salaryRange=salary,
            jobLevel=jobLevel,
            employeeRole=employeeRole,
            tags=re.findall(r'\[(.*?)\]', skills_text or '') # Simple tags from skills
        )
        self.log(f"Successfully parsed and structured item: {title} at {company}", level=logging.INFO)
        yield job_item

    def is_relevant_job(self, title: str) -> bool:
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.ai_niches)

    async def errback_playwright(self, failure):
        self.log(f"Playwright request failed: {failure.value}", level=logging.ERROR)
        page = failure.request.meta.get("playwright_page")
        if page and not page.is_closed():
            await page.close()
