import asyncio
import os
from playwright.async_api import async_playwright

async def recon_scrape(url: str, output_dir: str, num_jobs: int = 5):
    """ 
    Navigates to a job board, finds the first few job links, clicks each one,
    and saves the resulting detail page HTML to a file.
    """
    print(f"Starting reconnaissance on {url}...")
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print(f"Navigating to job list page: {url}")
            await page.goto(url, wait_until="networkidle")
            
            list_selector = "li.list-group-item a.stretched-link"
            print(f"Waiting for job list selector: {list_selector}")
            await page.wait_for_selector(list_selector, timeout=20000)
            
            job_links = await page.query_selector_all(list_selector)
            job_links = job_links[:num_jobs] # Limit to the number of jobs we want
            
            print(f"Found {len(job_links)} job links to analyze.")
            
            urls_to_visit = []
            for link in job_links:
                href = await link.get_attribute('href')
                if href:
                    full_url = page.urljoin(href)
                    urls_to_visit.append(full_url)

            for i, job_url in enumerate(urls_to_visit):
                try:
                    print(f"({i+1}/{len(urls_to_visit)}) Navigating to job detail page: {job_url}")
                    await page.goto(job_url, wait_until="networkidle")
                    detail_container_selector = "[id^=mc_]"
                    await page.wait_for_selector(f"{detail_container_selector} h1", timeout=15000)
                    await page.wait_for_timeout(2000) # Extra wait for any final rendering
                    
                    container = await page.query_selector(detail_container_selector)
                    if container:
                        html_content = await container.inner_html()
                        output_path = os.path.join(output_dir, f"job_detail_{i+1}.html")
                        with open(output_path, "w", encoding="utf-8") as f:
                            f.write(html_content)
                        print(f"    -> Successfully saved HTML to {output_path}")
                    else:
                        print(f"    -> ERROR: Could not find detail container on {job_url}")
                except Exception as e:
                    print(f"    -> ERROR: Failed to process {job_url}. Reason: {e}")
                    # Optionally save a screenshot or full page HTML on error
                    error_path = os.path.join(output_dir, f"error_page_{i+1}.html")
                    await page.screenshot(path=error_path.replace('.html', '.png'))
                    print(f"    -> Saved screenshot of error to {error_path.replace('.html', '.png')}")

        except Exception as e:
            print(f"A critical error occurred: {e}")
        finally:
            await browser.close()
            print("Reconnaissance script finished.")

if __name__ == "__main__":
    # This script is designed to be run within the GitHub Actions environment.
    # The URL and output directory are hardcoded for this specific project.
    target_url = "https://foorilla.com/hiring/jobs/top/"
    output_directory = "recon_html"
    asyncio.run(recon_scrape(target_url, output_directory))
