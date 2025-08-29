import sys
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import WebDriverException

print("Attempting to initialize headless Firefox driver for Termux...")

try:
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Ensure this path is correct for their Termux geckodriver installation
    service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
    
    driver = webdriver.Firefox(service=service, options=options)
    print("Driver initialized successfully.")
    
    test_url = "https://www.google.com"
    print(f"Attempting to fetch {test_url}...")
    driver.get(test_url)
    
    print(f"Page title: {driver.title}")
    print(f"Current URL: {driver.current_url}")
    
    driver.quit()
    print("Driver quit successfully. Selenium test passed.")

except WebDriverException as e:
    print(f"Selenium test failed: {e}", file=sys.stderr)
    print("This indicates an issue with your Selenium/Firefox/geckodriver setup.", file=sys.stderr)
    print("Please ensure geckodriver is in /data/data/com.termux/files/usr/bin/ and Firefox is installed and accessible.", file=sys.stderr)
except Exception as e:
    print(f"An unexpected error occurred: {e}", file=sys.stderr)
    print("Please ensure all necessary Python packages (selenium, etc.) are installed.", file=sys.stderr)