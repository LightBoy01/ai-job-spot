import json
import feedparser
import sys
import itertools
import time
import os
import requests
import re
import logging
from bs4 import BeautifulSoup
from .api_client import send_to_ingest_api
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from urllib.parse import urlparse



# --- Configuration Loader ---
def load_pipeline_config():
    """Loads the pipeline configuration file."""
    config_path = os.path.join(os.path.dirname(__file__), 'pipeline_config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            if 'API_BASE_URL' not in config:
                print("Error: 'API_BASE_URL' not found in pipeline_config.json", file=sys.stderr)
                sys.exit(1)
            return config
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)

# --- Stateful Execution Functions ---
def get_existing_job_ids(config: dict) -> set:
    """Fetches all existing job IDs from the API to prevent duplicates."""
    # This function is now deprecated as the API handles duplicate checking,
    # but we keep it to avoid breaking the main loop immediately.
    # It will be removed in a future refactor.
    print("Warning: get_existing_job_ids is deprecated. The API now handles duplicate checks.")
    return set()






from .scrapers.rss_scraper import stream_rss_jobs
from .scrapers.foorilla_scraper import stream_foorilla_jobs, get_driver, resolve_application_link

def main():
    """Main function to orchestrate the entire data pipeline."""
    # Define the log file path
    LOG_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_run.log')

    # Redirect stdout and stderr to the log file
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    with open(LOG_FILE, 'w') as f:
        sys.stdout = f
        sys.stderr = f
        
        try:
            print("Starting stateful pipeline run...")
            config = load_pipeline_config()
            existing_ids = get_existing_job_ids(config)
            driver = get_driver()
            
            try:
                # Define all job streams from different sources
                rss_stream = stream_rss_jobs() or []
                foorilla_stream = stream_foorilla_jobs(driver, limit=5) # Increased limit for production

                # Chain all data-yielding streams together
                all_raw_job_streams = itertools.chain(rss_stream, foorilla_stream)

                print("\n--- Scraping and Sending to API ---")
                for raw_job in all_raw_job_streams:
                    print(f"  > Processing new job '{raw_job.get('title')}'...")
                    send_to_ingest_api(raw_job, config, method='POST')
                    time.sleep(1) # Add a small delay to be respectful to our own API

                print("\nPipeline finished successfully.")

            except Exception as e:
                print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
                # No sys.exit(1) in the log file version
            finally:
                print("Shutting down browser driver...")
                if driver:
                    driver.quit()
        finally:
            # Restore stdout and stderr
            sys.stdout = original_stdout
            sys.stderr = original_stderr
    
    # Print a final confirmation to the actual console
    print(f"Pipeline dry run complete. Output logged to {LOG_FILE}")

if __name__ == "__main__":
    # Re-pasting the full functions here since they were placeholders above
    

    
