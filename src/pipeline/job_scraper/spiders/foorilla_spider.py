import scrapy
from scrapy.http import Response
from scrapy_playwright.page import PageMethod
from urllib.parse import urljoin
from job_scraper.items import JobItem
from pydantic import ValidationError
import logging
import os
import re
from datetime import datetime

class FoorillaSpider(scrapy.Spider):
    name = 'foorilla'
    start_urls = ['https://foorilla.com/']

    def __init__(self, *args, **kwargs):
        super(FoorillaSpider, self).__init__(*args, **kwargs)
        self.config = self.settings.get('FOORILLA_SPIDER_CONFIG', {})
        self.debug_dir = self.settings.get('DEBUG_OUTPUT_DIR', 'debug_output')
        os.makedirs(self.debug_dir, exist_ok=True)
        logging.info("Foorilla Spider initialized.")

    def start_requests(self):
        self.log("Starting request to Foorilla.com, using Playwright.", level=logging.INFO)
        yield scrapy.Request(
            url=self.start_urls[0],
            meta=dict(
                playwright=True,
                playwright_include_page=True,
                playwright_page_methods=[
                    PageMethod("wait_for_selector", self.config.get("job_list_selector"), state="visible", timeout=20000),
                ],
                errback=self.errback,
            ),
            callback=self.parse_job_list
        )

    async def parse_job_list(self, response: Response):
        self.log(f"Successfully fetched job list page: {response.url}", level=logging.INFO)
        page = response.meta.get("playwright_page")
        if not page:
            self.log("Playwright page not found in meta. Cannot proceed.", level=logging.ERROR)
            return

        link_elements = await page.query_selector_all(f'{self.config.get("job_list_selector")} {self.config.get("job_link_selector")}')
        self.log(f"Found {len(link_elements)} potential job links on the page.", level=logging.INFO)

        job_count = 0
        for link_element in link_elements:
            hx_get = await link_element.get_attribute('hx-get')
            title = await link_element.inner_text()
            
            if hx_get and self.is_relevant_job(title):
                job_count += 1
                full_url = urljoin(response.url, hx_get)
                self.log(f"Yielding request for relevant job: '{title}' at {full_url}", level=logging.DEBUG)
                
                yield scrapy.Request(
                    url=full_url,
                    callback=self.parse_job_detail,
                    meta={
                        'job_title': title,
                        'application_link': full_url
                    }
                )
        
        self.log(f"Finished parsing job list. Found and yielded {job_count} relevant jobs.", level=logging.INFO)
        await page.close()

    def parse_job_detail(self, response: Response):
        self.log(f"Scraping job details from: {response.url}", level=logging.INFO)

        title = response.meta.get('job_title')
        application_link = response.meta.get('application_link')
        selectors = self.config.get("job_detail_selectors", {})

        company = response.css(selectors.get("company", "::text")).get(default='N/A').strip()
        location = response.css(selectors.get("location", "::text")).get(default='N/A').strip()
        description_html = response.css(selectors.get("description_container")).get(default='<p>Description not found.</p>')

        if description_html == '<p>Description not found.</p>':
            self.log(f'Could not find description for job: "{title}". Selector may be outdated.', level=logging.WARNING)
            self._save_debug_page(response, f"failed_description_{self.name}.html")

        # Best-effort extraction from the text content
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

    def _extract_posted_date(self, text: str) -> datetime | None:
        try:
            # Look for patterns like "Posted X days ago" or "Posted on ..."
            match = re.search(r'(posted|date posted):?\s*(\d+\s+\w+\s+ago|on\s+.*)', text, re.IGNORECASE)
            if match:
                date_str = match.group(2)
                # This is a placeholder for a real date parsing library like `dateparser`
                # For now, we just return the string
                self.log(f"Extracted date string: {date_str}", level=logging.DEBUG)
                # In a real scenario, you would parse `date_str` into a datetime object.
                # For now, we'll return None as we can't parse it reliably without more libraries.
                return None 
            return None
        except Exception as e:
            self.log(f"Error extracting posted date: {e}", level=logging.ERROR)
            return None

    def _extract_salary(self, text: str) -> str | None:
        try:
            # Look for patterns like $100,000 - $150,000 or similar
            match = re.search(r'\$(\d{1,3}(?:,\d{3})*\d*)\s*(-|to)\s*\$(\d{1,3}(?:,\d{3})*\d*)', text, re.IGNORECASE)
            if match:
                return match.group(0)
            # Look for a single salary
            match = re.search(r'\$(\d{1,3}(?:,\d{3})*\d*)', text, re.IGNORECASE)
            if match:
                return match.group(0)
            return None
        except Exception as e:
            self.log(f"Error extracting salary: {e}", level=logging.ERROR)
            return None

    def is_relevant_job(self, title: str) -> bool:
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.config.get("ai_niches", []))

    def _save_debug_page(self, response: Response, filename: str):
        """Saves the response body to a file for debugging purposes."""
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
            # Try to save the page content if possible
            try:
                html_content = await page.content()
                filepath = os.path.join(self.debug_dir, f"failed_request_{self.name}.html")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                self.log(f"Saved failed page HTML to: {filepath}", level=logging.DEBUG)
            except Exception as e:
                self.log(f"Could not save failed page content: {e}", level=logging.ERROR)
            finally:
                await page.close()
