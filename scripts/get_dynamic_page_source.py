import asyncio
import argparse
from playwright.async_api import async_playwright

async def get_dynamic_page_source(url: str, output_path: str):
    """Fetches a URL with Playwright and saves its content after a wait."""
    print(f"Fetching {url} with Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(5000) # Wait 5 seconds for dynamic content
            html_content = await page.content()
        except Exception as e:
            print(f"Error fetching or processing page: {e}")
            await browser.close()
            return
        finally:
            await browser.close()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Successfully saved dynamic page HTML to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch a page with Playwright and save its HTML.")
    parser.add_argument("url", type=str, help="The URL to fetch.")
    parser.add_argument("--output", type=str, default="dynamic_page.html", help="Path to save the HTML file.")
    args = parser.parse_args()

    asyncio.run(get_dynamic_page_source(args.url, args.output))