import scrapy
from scrapy.http import Response
from scrapy_playwright.page import PageMethod
from urllib.parse import urljoin
from job_scraper.items import JobItem
from pydantic import ValidationError
import logging
import os
import re
import json
from datetime import datetime
import dateparser

class ConfigurableSpider(scrapy.Spider):
    name = "configurable"
    
    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super(ConfigurableSpider, cls).from_crawler(crawler, *args, **kwargs)
        
        # Get the config as a string and parse it
        config_str = crawler.settings.get('SPIDER_CONFIG', '{}')
        try:
            spider.settings_dict = json.loads(config_str)
        except json.JSONDecodeError:
            raise ValueError("Failed to decode SPIDER_CONFIG. Please ensure it is valid JSON.")
        
        # Core settings
        spider.start_urls = [spider.settings_dict.get('start_url')]
        spider.allowed_domains = spider.settings_dict.get('allowed_domains', [])
        
        # Selector settings
        spider.job_list_selector = spider.settings_dict.get('job_list_selector')
        spider.job_link_selector = spider.settings_dict.get('job_link_selector')
        spider.job_detail_selectors = spider.settings_dict.get('job_detail_selectors', {})
        
        # Pagination settings
        spider.pagination_config = spider.settings_dict.get('pagination', {})
        spider.max_pages = int(crawler.settings.get('CLOSESPIDER_ITEMCOUNT', 5))
        
        # Content settings
        spider.ai_niches = spider.settings_dict.get('ai_niches', [])
        
        # Debug settings
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
        self.log(f"Starting request to {self.start_urls[0]}, using Playwright.", level=logging.INFO)
        yield scrapy.Request(
            url=self.start_urls[0],
            meta=dict(
                playwright=True,
                playwright_include_page=True,
                playwright_page_methods=[
                    PageMethod("wait_for_selector", self.job_list_selector, state="visible", timeout=20000),
                ],
                errback=self.errback,
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

        # --- 1. Parse jobs on the current page ---
        link_elements = await page.query_selector_all(f'{self.job_list_selector} {self.job_link_selector}')
        self.log(f"Found {len(link_elements)} potential job links on page {page_number}.", level=logging.INFO)

        job_count = 0
        for link_element in link_elements:
            # This logic is still a bit specific, needs generalization
            url_fragment = await link_element.get_attribute('href') or await link_element.get_attribute('hx-get')
            title = await link_element.inner_text()
            
            if url_fragment and self.is_relevant_job(title):
                job_count += 1
                full_url = urljoin(response.url, url_fragment)
                self.log(f"Yielding request for relevant job: '{title}' at {full_url}", level=logging.DEBUG)
                
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_job_detail,
                    meta={'job_title': title, 'application_link': full_url}
                )
        
        self.log(f"Finished parsing page {page_number}. Found and yielded {job_count} relevant jobs.", level=logging.INFO)

        # --- 2. Handle Pagination ---
        if page_number >= self.max_pages:
            self.log(f"Reached max page limit ({self.max_pages}). Stopping pagination.", level=logging.INFO)
            await page.close()
            return

        pagination_type = self.pagination_config.get('type')
        if pagination_type == 'htmx':
            async for r in self.handle_htmx_pagination(page, response, page_number):
                yield r
        elif pagination_type == 'next_button':
            # To be implemented
            pass
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
                        errback=self.errback,
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
        # This method remains largely the same, as it's driven by selectors
        self.log(f"Scraping job details from: {response.url}", level=logging.INFO)

        title = response.meta.get('job_title')
        application_link = response.meta.get('application_link')
        selectors = self.job_detail_selectors

        company = response.css(selectors.get("company", "::text")).get(default='N/A').strip()
        location = response.css(selectors.get("location", "::text")).get(default='N/A').strip()
        description_html = response.css(selectors.get("description_container")).get(default='<p>Description not found.</p>')

        if description_html == '<p>Description not found.</p>':
            self.log(f'Could not find description for job: "{title}". Selector may be outdated.', level=logging.WARNING)
            self._save_debug_page(response, f"failed_description_{self.name}.html")

        plain_text = ' '.join(response.css(f'{selectors.get("description_container", "body")} *::text').getall())
        
        posted_date = self._extract_posted_date(plain_text)
        salary_range = self._extract_salary(plain_text)

        try:
            job_item = JobItem(
                title=title,
                company=company,
                location=location,
                description=description_html,
                applicationLink=application_link,
                source=self.name,
                postedDate=posted_date,
                salaryRange=salary_range,
            )
            self.log(f"Successfully scraped and validated item: {title} at {company}", level=logging.INFO)
            yield job_item
        except ValidationError as e:
            self.log(f'Data validation failed for job: "{title}". Reason: {e}', level=logging.ERROR)
            self._save_debug_page(response, f"failed_validation_{self.name}.html")

    def is_relevant_job(self, title: str) -> bool:
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.ai_niches)

    def _extract_posted_date(self, text: str) -> datetime | None:
        # This helper function is generic enough to keep
        try:
            match = re.search(r'(posted|date posted):?\s*(\d+\s+\w+\s+ago|on\s+.*)', text, re.IGNORECASE)
            if match:
                date_str = match.group(2)
                parsed_date = dateparser.parse(date_str)
                if parsed_date:
                    return parsed_date
            return None
        except Exception:
            return None

    def _extract_salary(self, text: str) -> str | None:
        # This helper function is also generic
        try:
            salary_patterns = [
                r'(\$|£|€|¥)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?k?)\s*(?:-|to)?\s*(\$|£|€|¥)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?k?)\s*(?:per year|p\.a\.|annually)?',
                r'(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?k?)\s*(?:-|to)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?k?)\s*(?:USD|EUR|GBP|JPY)\s*(?:per year|p\.a\.|annually)?',
            ]
            for pattern in salary_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
            return None
        except Exception:
            return None

    def _save_debug_page(self, response: Response, filename: str):
        filepath = os.path.join(self.debug_dir, filename)
        try:
            with open(filepath, 'wb') as f:
                f.write(response.body)
            self.log(f"Saved debug file to: {filepath}", level=logging.DEBUG)
        except IOError as e:
            self.log(f"Failed to save debug file: {e}", level=logging.ERROR)

    async def errback(self, failure):
        self.log(f"Playwright request failed: {failure.value}", level=logging.ERROR)
        page = failure.request.meta.get("playwright_page")
        if page and not page.is_closed():
            try:
                html_content = await page.content()
                filepath = os.path.join(self.debug_dir, f"failed_request_{self.name}.html")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                self.log(f"Saved failed page HTML to: {filepath}", level=logging.DEBUG)
            finally:
                await page.close()
