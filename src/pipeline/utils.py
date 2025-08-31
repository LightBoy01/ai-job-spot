import sys
from playwright.sync_api import sync_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError

_playwright_instance = None
_browser_instance = None

def get_driver() -> Browser:
    """Initializes and returns a Playwright Browser object."""
    global _playwright_instance, _browser_instance
    if _browser_instance:
        return _browser_instance

    print("Initializing headless Playwright browser...")
    try:
        _playwright_instance = sync_playwright().start()
        _browser_instance = _playwright_instance.firefox.launch(headless=True)
        return _browser_instance
    except Exception as e:
        print(f"Error initializing Playwright browser: {e}", file=sys.stderr)
        sys.exit(1)

def close_driver():
    """Closes the Playwright browser instance."""
    global _playwright_instance, _browser_instance
    if _browser_instance:
        _browser_instance.close()
        _browser_instance = None
    if _playwright_instance:
        _playwright_instance.stop()
        _playwright_instance = None

def resolve_application_link(page: Page, internal_apply_url: str) -> str:
    """Navigates to an internal apply URL and resolves the final external link using Playwright."""
    print(f"    - Resolving application link from: {internal_apply_url}")
    try:
        page.goto(internal_apply_url, wait_until="domcontentloaded")
        # Wait for URL to change, or for a reasonable time if no immediate redirect
        page.wait_for_timeout(2000) # Wait for 2 seconds for potential redirects
        final_url = page.url
        print(f"    - Resolved to: {final_url}")
        return final_url
    except PlaywrightTimeoutError as e:
        print(f"    - Timeout resolving application link {internal_apply_url}: {e}", file=sys.stderr)
        return internal_apply_url # Return the internal URL if resolution fails
    except Exception as e:
        print(f"    - Error resolving application link {internal_apply_url}: {e}", file=sys.stderr)
        return internal_apply_url # Return the internal URL if resolution fails
