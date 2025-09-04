
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
        config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'foorilla_config.json')
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.processed_urls = set()

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
        
        job_links_on_page = await page.query_selector_all(f'{self.config.get("job_list_selector")} {self.config.get("job_link_selector")}')

        for link_element in job_links_on_page:
            hx_get = await link_element.get_attribute('hx-get')
            if hx_get and hx_get not in self.processed_urls:
                self.processed_urls.add(hx_get)
                title = await link_element.inner_text()

                if self.is_relevant_job(title):
                    base_url = urlparse(self.start_urls[0])._replace(path='').geturl()
                    full_url = f"{base_url}{hx_get}"

                    await link_element.click()
                    await page.wait_for_selector(f'{self.config["job_detail_selectors"]["description_container"]} h1', state="visible", timeout=10000)
                    await page.wait_for_timeout(2000)

                    detail_container = await page.query_selector(self.config["job_detail_selectors"]["description_container"])
                    detail_html = await detail_container.inner_html()

                    job_item = self.scrape_job_details(detail_html, page.url)
                    job_item['title'] = title
                    job_item['applicationLink'] = full_url
                    job_item['source'] = self.name

                    yield job_item

    def scrape_job_details(self, html_content, page_url):
        soup = BeautifulSoup(html_content, 'lxml')
        selectors = self.config.get("job_detail_selectors", {})

        job_item = JobItem()
        job_item['id'] = '' # Will be generated in pipeline
        job_item['company'] = soup.select_one(selectors.get("company")).get_text(strip=True).replace('@', '').strip() if soup.select_one(selectors.get("company")) else "N/A"
        job_item['location'] = soup.select_one(selectors.get("location")).get_text(strip=True) if soup.select_one(selectors.get("location")) else "N/A"
        job_item['description'] = str(soup)
        # Other fields will be populated from the main parse method or in pipelines
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
        """Checks if a job title seems relevant to our AI niches."""
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.config.get("ai_niches", []))

    async def errback(self, failure):
        self.logger.error(f"Playwright Error: {failure.value}")
        page = failure.request.meta["playwright_page"]
        if page:
            await page.close()
