
import argparse
import sys
import time
from bs4 import BeautifulSoup, Comment, Tag
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import TimeoutException

# --- Salvaged Functions from scrythe/functions/functions_builder.py ---

def clean_html_attributes(tag: Tag, extra_cleaning: bool = False) -> None:
    """Clean HTML tag attributes based on cleaning level."""
    if extra_cleaning:
        allowed_attrs = {'src', 'href'}
        tag.attrs = {k: v for k, v in tag.attrs.items() if k in allowed_attrs}
    else:
        if tag.name == 'img' and tag.get('src', '').startswith('data:'):
            tag.decompose()

def get_tags_to_remove(extra_cleaning: bool = False) -> list[str]:
    """Get list of HTML tags to remove based on cleaning level."""
    tags = ['script', 'head', 'style', 'footer', 'nav', 'header']
    if extra_cleaning:
        tags.extend(['symbol', 'svg', 'noscript', 'iframe'])
    return tags

def clean_html_content(soup: BeautifulSoup, extra_cleaning: bool = False) -> BeautifulSoup:
    """Clean HTML content by removing unnecessary elements."""
    for tag_name in get_tags_to_remove(extra_cleaning):
        for element in soup.find_all(tag_name):
            element.decompose()
    
    for tag in soup.find_all(True):
        clean_html_attributes(tag, extra_cleaning)
    
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    
    return soup

def clean_page(html: str, extra_cleaning: bool = False) -> str:
    """Clean page HTML content."""
    soup = BeautifulSoup(html, 'lxml')
    cleaned_soup = clean_html_content(soup, extra_cleaning)
    return str(cleaned_soup)

# --- Main Script Logic ---

def fetch_and_clean_html(url: str) -> str:
    """
    Uses Selenium to fetch the fully rendered HTML from a URL and cleans it.
    """
    print(f"Initializing headless Firefox driver for Termux...")
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    # Correct path for geckodriver in Termux
    service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
    driver = None
    html_content = ""

    try:
        driver = webdriver.Firefox(service=service, options=options)
        print(f"Navigating to {url}...")
        driver.get(url)
        
        # Wait for dynamic content to load
        time.sleep(10) 
        
        print("Fetching page source...")
        html_content = driver.page_source
        print(f"Successfully fetched {len(html_content)} bytes of HTML.")

    except TimeoutException:
        print(f"Error: Timeout while trying to load {url}", file=sys.stderr)
        return ""
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        return ""
    finally:
        if driver:
            driver.quit()
            print("Browser closed.")

    if not html_content:
        print("Error: Failed to fetch HTML content.", file=sys.stderr)
        return ""

    print("Cleaning HTML...")
    cleaned_html = clean_page(html_content)
    print(f"HTML cleaned. Final size: {len(cleaned_html)} bytes.")
    return cleaned_html

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and clean HTML from a dynamic website.")
    parser.add_argument("url", type=str, help="The URL to fetch and clean.")
    args = parser.parse_args()

    final_html = fetch_and_clean_html(args.url)
    
    if final_html:
        # Print the final cleaned HTML to standard output
        print("\n--- CLEANED HTML START ---\n")
        print(final_html)
        print("\n--- CLEANED HTML END ---\n")
