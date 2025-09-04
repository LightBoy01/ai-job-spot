import os
import pytest
from scrapy.http import HtmlResponse
from job_scraper.spiders.foorilla_spider import FoorillaSpider
from job_scraper.items import JobItem

@pytest.fixture
def spider():
    return FoorillaSpider()

@pytest.fixture
def mock_html_response():
    """Reads the mock HTML file and creates a Scrapy HtmlResponse."""
    html_path = os.path.join(os.path.dirname(__file__), 'foorilla_job_detail.html')
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # The URL is important for Scrapy to know the context
    return HtmlResponse(url="https://foorilla.com/job/123", body=html_content, encoding='utf-8')

def test_scrape_job_details(spider, mock_html_response):
    """Tests the job detail parsing logic of the Foorilla spider."""
    # The spider's parse method is async, but the helper method we want to test is sync
    parsed_item = spider.scrape_job_details(mock_html_response.body, mock_html_response.url)

    assert isinstance(parsed_item, JobItem)
    assert parsed_item['company'] == "TechCorp"
    assert parsed_item['location'] == "San Francisco, CA"
    # The description is the whole soup, so we check for containment
    assert "<h1>Senior AI Engineer</h1>" in parsed_item['description']
    assert "<p>This is the job description.</p>" in parsed_item['description']
