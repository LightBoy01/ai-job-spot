import scrapy
from scrapy.http import Response
from scrapy_playwright.page import PageMethod
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from job_scraper.items import JobItem
import logging

class FoorillaSpider(scrapy.Spider):
    name = 'foorilla'
    start_urls = ['https://foorilla.com/']

    def __init__(self, *args, **kwargs):
        super(FoorillaSpider, self).__init__(*args, **kwargs)
        # TODO: Configuration will be injected here in Phase 2
        self.config = {
            "job_list_selector": "li.list-group-item",
            "job_link_selector": "a[hx-get]",
            "ai_niches": ["AI", "Machine Learning", "Data Scientist", "Data Analyst", "ML", "NLP", "Computer Vision"],
            "job_detail_selectors": {
                "company": "h3.text-muted",
                "location": "h3.text-muted + p",
                "description_container": "div.job-details"
            }
        }
        logging.info("Foorilla Spider initialized with temporary config.")

    def start_requests(self):
        """
        Starts the scraping process by sending a request to the start URL.
        Uses Playwright to ensure JavaScript-rendered content is loaded.
        """
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
        """
        Parses the main job list page to find individual job links.
        This method extracts the partial URLs and yields new requests for each job detail page.
        """
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
        """
        Parses the job detail page to extract all relevant information.
        This method receives the response from the individual job URL request.
        """
        self.log(f"Scraping job details from: {response.url}", level=logging.INFO)
        
        title = response.meta.get('job_title')
        application_link = response.meta.get('application_link')

        soup = BeautifulSoup(response.text, 'lxml')
        selectors = self.config.get("job_detail_selectors", {})
        
        # Extract data using BeautifulSoup
        company_element = soup.select_one(selectors.get("company"))
        company = company_element.get_text(strip=True).replace('@', '').strip() if company_element else "N/A"
        
        location_element = soup.select_one(selectors.get("location"))
        location = location_element.get_text(strip=True) if location_element else "N/A"
        
        description_container = soup.select_one(selectors.get("description_container"))
        description_html = str(description_container) if description_container else "<p>Description not found.</p>"

        # Populate the JobItem
        job_item = JobItem()
        job_item['id'] = ''  # Will be generated in a later pipeline stage
        job_item['title'] = title
        job_item['company'] = company
        job_item['location'] = location
        job_item['description'] = description_html
        job_item['applicationLink'] = application_link
        job_item['source'] = self.name
        
        # Fields to be populated later or if found on page
        job_item['postedDate'] = None
        job_item['expirationDate'] = None
        job_item['salaryRange'] = None
        job_item['jobLevel'] = None
        job_item['employeeRole'] = None
        job_item['isNew'] = True
        job_item['tags'] = []
        job_item['responsibilities'] = []
        job_item['qualifications'] = []
        
        self.log(f"Successfully scraped item: {title} at {company}", level=logging.INFO)
        yield job_item

    def is_relevant_job(self, title: str) -> bool:
        """Checks if a job title contains any of the relevant keywords."""
        title_lower = title.lower()
        return any(n.lower() in title_lower for n in self.config.get("ai_niches", []))

    async def errback(self, failure):
        """Handles errors from Playwright requests."""
        self.log(f"Playwright request failed: {failure.value}", level=logging.ERROR)
        page = failure.request.meta.get("playwright_page")
        if page and not page.is_closed():
            await page.close()
