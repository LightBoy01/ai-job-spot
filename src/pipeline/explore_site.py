import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to https://foorilla.com/...")
        await page.goto("https://foorilla.com/", wait_until="networkidle")
        
        print("Waiting for the first job link to appear...")
        first_job_link_selector = "li.list-group-item a.stretched-link"
        await page.wait_for_selector(first_job_link_selector, timeout=15000)
        
        print("Clicking the first job link...")
        await page.click(first_job_link_selector)
        
        print("Waiting for job detail container to load...")
        detail_container_selector = "#mc_2"
        # We need to wait for the content inside mc_2 to be updated.
        # A simple way is to wait for a known element inside it, like an h1 for the title.
        await page.wait_for_selector(f"{detail_container_selector} h1", timeout=15000)
        await page.wait_for_timeout(3000) # Extra wait for any final rendering

        print("Getting job detail HTML...")
        detail_container = await page.query_selector(detail_container_selector)
        html_content = ""
        if detail_container:
            html_content = await detail_container.inner_html()
        else:
            print(f"Could not find detail container: {detail_container_selector}")

        # Save the HTML to a file
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        full_path = os.path.join(debug_dir, 'foorilla_job_detail_explore.html')
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"Successfully saved job detail HTML to: {full_path}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())