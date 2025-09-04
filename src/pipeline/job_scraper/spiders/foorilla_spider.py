import scrapy
from scrapy_playwright.page import PageMethod
from bs4 import BeautifulSoup
import json
import os
from urllib.parse import urlparse
from job_scraper.items import JobItem

class FoorillaSpider(scrapy.Spider):
    name = 'foorilla'
    start_urls = ['https://foorilla.com/']

    def __init__(self, *args, **kwargs):
        super(FoorillaSpider, self).__init__(*args, **kwargs)
        # Load configuration from Scrapy settings
        self.config = self.settings.get('FOORILLA_SPIDER_CONFIG')
        if not self.config:
            raise ValueError("Foorilla spider configuration not found in settings.")

    def start_requests(self):
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
            callback=self.parse
        )

    async def parse(self, response):
        page = response.meta["playwright_page"]
        
        # Step 1: Get all job identifiers first into a static list
        job_identifiers = []
        link_elements = await page.query_selector_all(f'{self.config.get("job_list_selector")} {self.config.get("job_link_selector")}')
        for link in link_elements:
            hx_get = await link.get_attribute('hx-get')
            title = await link.inner_text()
            if hx_get and self.is_relevant_job(title):
                job_identifiers.append({"hx_get": hx_get, "title": title})

        self.logger.info(f"Found {len(job_identifiers)} relevant job links to process.")

        # Step 2: Loop through the static list of identifiers
        for job_info in job_identifiers:
            try:
                self.logger.info(f"Processing job: {job_info['title']}")
                
                # Step 3: Find the element again right before interacting with it
                link_selector = f'a[hx-get="{job_info["hx_get"]}"]'
                link_element = await page.query_selector(link_selector)

                if not link_element:
                    self.logger.warning(f"Could not find link for {job_info['title']} after DOM change. It might have scrolled out of view. Skipping.")
                    continue

                await link_element.click()
                await page.wait_for_selector(f'{self.config["job_detail_selectors"]["description_container"]} h1', state="visible", timeout=10000)
                await page.wait_for_timeout(2000)

                detail_container = await page.query_selector(self.config["job_detail_selectors"]["description_container"])
                detail_html = await detail_container.inner_html()

                base_url = urlparse(self.start_urls[0])._replace(path='').geturl()
                full_url = f"{base_url}{job_info['hx_get']}"

                job_item = self.scrape_job_details(detail_html, page.url)
                job_item['title'] = job_info['title']
                job_item['applicationLink'] = full_url
                job_item['source'] = self.name

                yield job_item
            except Exception as e:
                self.logger.error(f"Failed to process job '{job_info['title']}'. Reason: {e}")
                # In case of error, we continue to the next job in our static list
                continue

    def scrape_job_details(self, html_content, page_url):
        soup = BeautifulSoup(html_content, 'lxml')
        selectors = self.config.get("job_detail_selectors", {})

        job_item = JobItem()
        job_item['id'] = '' # Will be generated in pipeline
        job_item['company'] = soup.select_one(selectors.get("company")).get_text(strip=True).replace('@', '').strip() if soup.select_one(selectors.get("company")) else "N/A"
        job_item['location'] = soup.select_one(selectors.get("location")).get_text(strip=True) if soup.select_one(selectors.get("location")) else "N/A"
        job_item['description'] = str(soup)
        job_item['postedDate'] = None 
        job_item['expirationDate'] = None
        job_item['salaryRange'] = None
        job_item['jobLevel'] = None
        job_item['employeeRole'] = None
        job_item['isNew'] = True
        job_item['tags'] = []
        job_item['responsibilities'] = []
        job_item['qualifications'] = []
        
        return job_item

    def is_relevant_job(self, title: str) -> bool:
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.config.get("ai_niches", []))

    async def errback(self, failure):
        self.logger.error(f"Playwright Error: {failure.value}")
        page = failure.request.meta.get("playwright_page")
        if page:
            await page.close()