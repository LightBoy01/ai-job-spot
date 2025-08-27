from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
import time

# Configure Firefox to run in headless mode
options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox") # Essential for Termux
options.add_argument("--disable-dev-shm-usage") # Essential for Termux

# Initialize the Firefox driver
# Ensure geckodriver is in your PATH or specify its executable_path
try:
    service = Service(executable_path="/data/data/com.termux/files/usr/bin/geckodriver")
    driver = webdriver.Firefox(service=service, options=options)
    print("Firefox driver initialized successfully.")

    # Navigate to a dynamic website (e.g., one that loads content with JS)
    url = "https://hiring.cafe" # Replace with a dynamic URL
    driver.get(url)
    print(f"Navigating to {url}")

    # Wait for content to load (adjust time as needed)
    time.sleep(5)

    # Example: Find an element by its ID or class after JS has rendered
    # You'll need to inspect the target website's HTML to find appropriate selectors
    try:
        # This is a placeholder; replace with an actual element from your target site
        dynamic_element = driver.find_element(By.TAG_NAME, "body")
        print(f"Content of dynamic element (body): {dynamic_element.text[:500]}...") # Print first 500 chars
    except Exception as e:
        print(f"Could not find dynamic element: {e}")

    # Take a screenshot (optional, for debugging)
    driver.save_screenshot("dynamic_page_screenshot.png")
    print("Screenshot saved as dynamic_page_screenshot.png")

finally:
    # Close the browser
    if 'driver' in locals() and driver:
        driver.quit()
        print("Browser closed.")
