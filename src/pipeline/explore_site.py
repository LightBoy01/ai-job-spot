
import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to https://foorilla.com/...")
        await page.goto("https://foorilla.com/", wait_until="networkidle")
        
        # Give it a bit more time for any final client-side rendering
        await page.wait_for_timeout(5000)
        
        print("Getting page content...")
        html_content = await page.content()
        
        # Use the save_html_to_file logic from configurable_scraper.py
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        full_path = os.path.join(debug_dir, 'foorilla_main_page_explore.html')
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        print(f"Successfully saved dynamically loaded HTML to: {full_path}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
