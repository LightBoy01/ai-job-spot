import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import sys

def get_dynamic_page_source_selenium(url: str):
    """Fetches a URL with Selenium and prints its content after a wait."""
    print(f"Fetching {url} with Selenium...", file=sys.stderr)
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)
        time.sleep(5) # Wait 5 seconds for dynamic content
        html_content = driver.page_source
        print(html_content)
    except Exception as e:
        print(f"Error fetching or processing page: {e}", file=sys.stderr)
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python get_dynamic_page_source_selenium.py <URL>", file=sys.stderr)
        sys.exit(1)
    
    url = sys.argv[1]
    get_dynamic_page_source_selenium(url)