#!/usr/bin/env python3
import httpx
import argparse
import time
import os
import re
from datetime import datetime
import bleach

# --- Configuration ---
API_URL = "https://hiring.cafe/api/search-jobs"
JOBS_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'job-descriptions')
DEFAULT_QUERY = "AI"

# --- Helper Functions ---

def slugify(text):
    """
    Convert a string to a URL-friendly slug.
    """
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

def create_job_id(job_title, company_name, original_id):
    """
    Creates a unique, SEO-friendly ID for a job.
    """
    title_slug = slugify(job_title)
    company_slug = slugify(company_name)
    # Use a small part of the original ID for uniqueness
    unique_hash = original_id[:6]
    return f"{title_slug}-{company_slug}-{unique_hash}"

def sanitize_html(content):
    """
    Sanitizes HTML content to prevent XSS, allowing only a safe subset of tags.
    """
    allowed_tags = ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i']
    return bleach.clean(content, tags=allowed_tags, strip=True)

# --- Main Logic ---

def fetch_jobs(query, max_pages=5):
    """
    Fetches all job listings from the hiring.cafe API using pagination.
    """
    all_jobs = []
    for page in range(max_pages):
        print(f"Fetching page {page + 1} for query: '{query}'...")
        payload = {
            "size": 50,
            "page": page,
            "searchState": {
                "searchQuery": query,
                "sortBy": "date"
            }
        }
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        try:
            with httpx.Client(headers=headers) as client:
                response = client.post(API_URL, json=payload, timeout=15)
                response.raise_for_status()
                jobs = response.json().get('results', [])
                if not jobs:
                    print("No more jobs found on this page. Stopping.")
                    break
                all_jobs.extend(jobs)
                time.sleep(1)  # Be a good API citizen
        except httpx.HTTPStatusError as e:
            print(f"ERROR: HTTP Error occurred: {e.response.status_code} - {e.response.text}")
            break
        except httpx.RequestError as e:
            print(f"ERROR: Could not fetch data from API: {e}")
            break
    return all_jobs

def process_and_write_jobs(jobs):
    """
    Processes a list of jobs and writes them to Markdown files.
    """
    new_jobs_count = 0
    skipped_jobs_count = 0
    os.makedirs(JOBS_DIR, exist_ok=True)

    for job in jobs:
        original_id = job.get('id')
        if not original_id:
            print(f"WARNING: Skipping job with missing ID. Data: {job}")
            continue

        job_info = job.get('job_information', {})
        title = job_info.get('title')
        company = job.get('source') # Using 'source' as a proxy for company name
        application_link = job.get('apply_url')

        if not all([title, company, application_link]):
            print(f"WARNING: Skipping job {original_id} due to missing critical fields (title, company, or link). Data: {job}")
            continue

        generated_id = create_job_id(title, company, original_id)
        file_path = os.path.join(JOBS_DIR, f"{generated_id}.md")

        if os.path.exists(file_path):
            skipped_jobs_count += 1
            continue

        # Sanitize description
        description_html = job_info.get('description', '<p>No description provided.</p>')
        sanitized_description = sanitize_html(description_html)

        # Create frontmatter
        frontmatter = {
            'id': generated_id,
            'title': title,
            'company': company,
            'location': job_info.get('location', 'Remote'),
            'applicationLink': application_link,
            'postedDate': job.get('date', datetime.now(datetime.UTC).isoformat() + 'Z'),
            'postedDateSource': 'AI Job Spot Processing Date (hiring.cafe API does not provide original posted date)',
            'source': job.get('source', 'hiring.cafe'),
            'provenance': 'hiring.cafe',
            'status': 'open',
            'jobLevel': 'Not specified',
            'employeeRole': 'Not specified',
            'tags': job_info.get('tags', []),
            'companyLogo': job.get('companyLogo'),
        }

        # --- Robust YAML Frontmatter Construction ---
        content = "---\n"
        for key, value in frontmatter.items():
            if value is None:
                content += f"{key}: null\n"
            elif isinstance(value, bool):
                content += f"{key}: {str(value).lower()}\n"
            elif isinstance(value, (int, float)):
                content += f"{key}: {value}\n"
            elif isinstance(value, list):
                # Assumes a list of simple, non-string-like items or simple strings
                content += f"{key}: {str(value)}\n"
            else:  # Treat as a string
                # Use double quotes and escape backslashes and double quotes
                value_str = str(value).replace('\\', '\\\\').replace('"', '\\"')
                content += f'{key}: "{value_str}"\n'
        content += "---\n\n"
        content += sanitized_description

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            new_jobs_count += 1
            print(f"Successfully created: {file_path}")
        except IOError as e:
            print(f"ERROR: Could not write file {file_path}. Reason: {e}")

    print(f"\n--- Summary ---")
    print(f"New jobs created: {new_jobs_count}")
    print(f"Jobs skipped (already exist): {skipped_jobs_count}")

def main():
    """
    Main function to run the script.
    """
    parser = argparse.ArgumentParser(description="Import job postings from hiring.cafe API.")
    parser.add_argument(
        '--query',
        type=str,
        default=DEFAULT_QUERY,
        help=f"The search query for jobs (e.g., 'AI', 'Machine Learning'). Defaults to '{DEFAULT_QUERY}'."
    )
    args = parser.parse_args()

    print("--- Starting Job Import from hiring.cafe ---")
    jobs = fetch_jobs(args.query)
    if jobs:
        process_and_write_jobs(jobs)
    print("--- Import Finished ---")

if __name__ == "__main__":
    main()
