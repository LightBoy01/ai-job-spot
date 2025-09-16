import asyncio
import os
from playwright.async_api import async_playwright
from urllib.parse import urljoin

async def recon_scrape(url: str, output_dir: str, num_jobs: int = 5):
    """ 
    Navigates to a job board, finds the first few job links, then uses a client-side
    fetch with the correct HTMX header to get the clean HTML partial for each job.
    """
    print(f"Starting reconnaissance on {url}...")
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        try:
            print(f"Navigating to job list page: {url}")
            await page.goto(url, wait_until="networkidle")
            
            list_selector = "li.list-group-item a.stretched-link"
            print(f"Waiting for job list selector: {list_selector}")
            await page.wait_for_selector(list_selector, timeout=20000)
            
            job_links = await page.query_selector_all(list_selector)
            job_links = job_links[:num_jobs]
            
            print(f"Found {len(job_links)} job links to analyze.")
            
            urls_to_visit = []
            for link in job_links:
                href = await link.get_attribute('href')
                if not href:
                    href = await link.get_attribute('hx-get')
                
                if href:
                    full_url = urljoin(page.url, href)
                    urls_to_visit.append(full_url)

            for i, job_url in enumerate(urls_to_visit):
                try:
                    print(f"({i+1}/{len(urls_to_visit)}) Processing job detail page: {job_url}")
                    
                    # This is the new hybrid approach. We use page.evaluate to run a 
                    # script in the browser that can make a fetch request with custom headers.
                    html_content = await page.evaluate('''
                        async (url) => {
                            const response = await fetch(url, {
                                headers: {
                                    'HX-Request': 'true'
                                }
                            });
                            return await response.text();
                        }
                    ''', job_url)

                    if html_content:
                        output_path = os.path.join(output_dir, f"job_detail_{i+1}.html")
                        with open(output_path, "w", encoding="utf-8") as f:
                            f.write(html_content)
                        print(f"    -> Successfully saved clean HTML to {output_path}")
                    else:
                        print(f"    -> ERROR: Fetched content was empty for {job_url}")

                except Exception as e:
                    print(f"    -> ERROR: Failed to process {job_url}. Reason: {e}")
                    error_path = os.path.join(output_dir, f"error_page_{i+1}.html")
                    await page.screenshot(path=error_path.replace('.html', '.png'))
                    print(f"    -> Saved screenshot of error to {error_path.replace('.html', '.png')}")

        except Exception as e:
            print(f"A critical error occurred: {e}")
        finally:
            await browser.close()
            print("Reconnaissance script finished.")

if __name__ == "__main__":
    target_url = "https://foorilla.com/hiring/jobs/top/"
    output_directory = "recon_html"
    asyncio.run(recon_scrape(target_url, output_directory))
