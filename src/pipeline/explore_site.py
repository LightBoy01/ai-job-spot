import asyncio
import json
import argparse
import os
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def analyze_and_save(url: str, output_path: str):
    """Fetches a URL, saves its content, and analyzes its structure."""
    print(f"Analyzing {url}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle")
            
            # Click the first job link to get to a detail view
            first_job_link_selector = "li.list-group-item a.stretched-link"
            await page.wait_for_selector(first_job_link_selector, timeout=15000)
            await page.click(first_job_link_selector)
            
            # Wait for the detail container to load
            detail_container_selector = "[id^=mc_]"
            await page.wait_for_selector(f"{detail_container_selector} h1", timeout=15000)
            await page.wait_for_timeout(3000) # Extra wait

            detail_container = await page.query_selector(detail_container_selector)
            html_content = await detail_container.inner_html()

        except Exception as e:
            print(f"Error fetching or processing page: {e}")
            await browser.close()
            return

        await browser.close()

    # Save the HTML content for testing
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Successfully saved job detail HTML to: {output_path}")

    # --- Analysis Part ---
    soup = BeautifulSoup(html_content, 'lxml')
    suggestions = {
        "start_url": url,
        "job_list_selector": "li.list-group-item", # Known from previous analysis
        "job_link_selector": "a.stretched-link", # Known
        "ai_niches": ["AI", "Machine Learning", "Data Scientist"], 
        "job_detail_selectors": {
            "title": "h1",
            "company": "strong.company-name",
            "location": ".hstack.justify-content-between > div:first-child",
            "description_container": "[id^=mc_]",
            "apply_button_selector": "a.btn:has-text('Apply')"
        }
    }

    print("\n--- Suggested Scraper Configuration ---")
    print(json.dumps(suggestions, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze a job board URL, save a sample file, and suggest a scraper configuration.")
    parser.add_argument("url", type=str, help="The URL of the job board to analyze.")
    parser.add_argument("--output", type=str, default="src/pipeline/tests/foorilla_job_detail.html", help="Path to save the sample HTML file.")
    args = parser.parse_args()

    asyncio.run(analyze_and_save(args.url, args.output))