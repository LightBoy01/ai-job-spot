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

    # --- Intelligent Description Container Analysis ---
    def find_description_container(soup_obj):
        keywords = ["description", "content", "body", "main", "details", "job-details", "job-description"]
        
        # Try to find elements with relevant IDs or classes
        for tag_name in ["div", "article", "section"]:
            for keyword in keywords:
                # Search by ID
                candidate = soup_obj.find(tag_name, id=lambda x: x and keyword in x.lower())
                if candidate and len(candidate.get_text(strip=True).split()) > 50: # Check for substantial text
                    return f"{tag_name}#{candidate['id']}"
                
                # Search by class
                candidate = soup_obj.find(tag_name, class_=lambda x: x and keyword in ' '.join(x).lower())
                if candidate and len(candidate.get_text(strip=True).split()) > 50:
                    return f"{tag_name}.{{' '.join(candidate['class'])} "

        # Fallback: find the largest text block within common containers
        best_candidate = None
        max_text_len = 0
        for tag_name in ["div", "article", "section"]:
            for element in soup_obj.find_all(tag_name):
                text_len = len(element.get_text(strip=True).split())
                if text_len > max_text_len and text_len > 100: # Must be substantial
                    best_candidate = element
                    max_text_len = text_len
        
        if best_candidate:
            # Try to get a unique selector for the best candidate
            if best_candidate.get('id'):
                return f"{best_candidate.name}#{best_candidate['id']}"
            elif best_candidate.get('class'):
                return f"{best_candidate.name}.{{' '.join(best_candidate['class'])}"
            else:
                # Fallback to a more general path if no id/class
                return f"{best_candidate.name}:nth-of-type({list(best_candidate.parent.children).index(best_candidate) + 1})"

        return "[id^=mc_]" # Default fallback if nothing better is found

    suggested_description_selector = find_description_container(soup)

    suggestions = {
        "start_url": url,
        "job_list_selector": "li.list-group-item", # Known from previous analysis
        "job_link_selector": "a.stretched-link", # Known
        "ai_niches": ["AI", "Machine Learning", "Data Scientist"], 
        "job_detail_selectors": {
            "title": "h1",
            "company": "strong.company-name",
            "location": ".hstack.justify-content-between > div:first-child",
            "description_container": suggested_description_selector,
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