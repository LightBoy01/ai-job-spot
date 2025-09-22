import sys
import argparse
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

def get_dynamic_page_source_selenium(url: str, timeout: int, selector: str):
    """
    Fetches a URL with Selenium, waits for a specific CSS selector to ensure
    dynamic content has loaded, and then prints the page source.
    """
    print(f"Fetching {url} with Selenium...", file=sys.stderr)
    
    firefox_options = Options()
    firefox_options.add_argument("--headless")
    firefox_options.add_argument("--no-sandbox")
    firefox_options.add_argument("--disable-dev-shm-usage")
    
    user_agent = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0"
    firefox_options.set_preference("general.useragent.override", user_agent)
    
    firefox_options.set_preference("permissions.default.image", 2)
    firefox_options.set_preference("permissions.default.stylesheet", 2)

    driver = None
    try:
        service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
        driver = webdriver.Firefox(service=service, options=firefox_options)
        driver.get(url)
        
        print(f"Waiting up to {timeout} seconds for selector '{selector}'...", file=sys.stderr)
        if selector == 'body':
            print("Warning: Waiting for 'body' selector. For best results on dynamic pages, provide a more specific --selector.", file=sys.stderr)

        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
        print("Dynamic content loaded.", file=sys.stderr)
        
        html_content = driver.page_source
        print(html_content)
        
    except TimeoutException:
        print(f"Error: Page load timed out after {timeout} seconds. The selector '{selector}' was not found.", file=sys.stderr)
    except WebDriverException as e:
        if "executable needs to be in PATH" in str(e):
            print("Error: 'geckodriver' not found. Please ensure it's installed and its path is correct in the script.", file=sys.stderr)
        else:
            print(f"A WebDriver error occurred: {e}", file=sys.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fetch dynamic page source using Selenium. Waits for a specific CSS selector to appear.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("url", help="The URL to fetch.")
    parser.add_argument(
        "--timeout",
        type=int,
        default=15,
        help="Timeout in seconds for the selector to appear. Default is 15."
    )
    parser.add_argument(
        "--selector",
        type=str,
        default="body",
        help="CSS selector to wait for before printing the page source. Example: '#main-content' or '.job-description'"
    )
    
    args = parser.parse_args()
    
    get_dynamic_page_source_selenium(args.url, args.timeout, args.selector)