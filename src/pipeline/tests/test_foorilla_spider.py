import os
import pytest
import json
from scrapy.http import HtmlResponse
from scrapy.settings import Settings
from scrapy.crawler import Crawler
from job_scraper.spiders.configurable_spider import ConfigurableSpider
from job_scraper.items import JobItem

# Mock configuration similar to what's in pipeline_config.json
FOORILLA_CONFIG = {
    "start_url": "https://foorilla.com/jobs?q=ai",
    "allowed_domains": ["foorilla.com"],
    "job_list_selector": "li.list-group-item",
    "job_link_selector": "a.stretched-link",
    "ai_niches": ["AI", "Machine Learning", "Data Scientist"],
    "job_detail_selectors": {
        "title": "h1",
        "company": "strong.company-name",
        "location": ".hstack.justify-content-between > div:first-child",
        "description_container": "#job-description", # Using a more specific ID for test HTML
    },
    "pagination": {
        "type": "htmx",
        "selector": "li[hx-get]:last-child"
    }
}

@pytest.fixture
def spider():
    """Creates and initializes the ConfigurableSpider for testing."""
    settings = Settings({
        'SPIDER_CONFIG': json.dumps(FOORILLA_CONFIG),
        'CLOSESPIDER_ITEMCOUNT': 1 # Limit for testing
    })
    crawler = Crawler(ConfigurableSpider, settings)
    return ConfigurableSpider.from_crawler(crawler)

@pytest.fixture
def mock_html_response():
    """Reads a mock HTML file and creates a Scrapy HtmlResponse for a detail page."""
    # A more realistic mock HTML for the detail page
    html_content = """
    <!DOCTYPE html>
    <html>
    <body>
        <h1>Senior AI Engineer</h1>
        <strong class="company-name">TechCorp</strong>
        <div class="hstack justify-content-between">
            <div>San Francisco, CA</div>
        </div>
        <div id="job-description">
            <p>This is the job description.</p>
            <p>Salary: $150,000 - $200,000</p>
        </div>
    </body>
    </html>
    """
    return HtmlResponse(
        url="https://foorilla.com/job/123-senior-ai-engineer",
        body=html_content,
        encoding='utf-8',
        meta={
            'job_title': 'Senior AI Engineer',
            'application_link': 'https://foorilla.com/job/123-senior-ai-engineer'
        }
    )

def test_parse_job_detail(spider, mock_html_response):
    """Tests the job detail parsing logic of the ConfigurableSpider."""
    # The parse_job_detail method is a generator, so we need to iterate over it
    parsed_items = list(spider.parse_job_detail(mock_html_response))
    
    # We expect it to yield exactly one item
    assert len(parsed_items) == 1
    
    parsed_item = parsed_items[0]

    assert isinstance(parsed_item, JobItem)
    assert parsed_item['title'] == "Senior AI Engineer"
    assert parsed_item['company'] == "TechCorp"
    assert parsed_item['location'] == "San Francisco, CA"
    assert parsed_item['salaryRange'] == "$150,000 - $200,000"
    
    # Check for containment in the description HTML
    assert "<p>This is the job description.</p>" in parsed_item['description']