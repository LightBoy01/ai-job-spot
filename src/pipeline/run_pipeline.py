import json
import sys
import itertools
import time
import os
import re
from datetime import datetime

# --- Helper function to create Markdown files #

def save_job_as_markdown(job_data: dict):
    """
    Takes a scraped job dictionary and saves it as a Markdown file
    with YAML frontmatter in the pending review directory.
    """
    # 1. Define the output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'pending_review')
    os.makedirs(output_dir, exist_ok=True)

    # 2. Create a unique filename
    company_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('company', 'nocompany').lower()).strip('-')
    title_slug = re.sub(r'[^a-z0-9]+', '-', job_data.get('title', 'notitle').lower()).strip('-')[:50]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"job-scraped-{company_slug}-{title_slug}-{timestamp}.md"
    filepath = os.path.join(output_dir, filename)

    # 3. Generate a consistent ID for the frontmatter
    job_id = os.path.splitext(filename)[0]

    # 4. Prepare frontmatter data, ensuring all fields exist and are properly quoted
    #    This structure is based on the analysis of existing job-XX.md files.
    frontmatter = {
        'id': job_id,
        'title': f"{job_data.get('title', 'N/A')}",
        'company': f"{job_data.get('company', 'N/A')}",
        'location': f"{job_data.get('location', 'N/A')}",
        'applicationLink': job_data.get('link', '#'),
        'postedDate': job_data.get('postedDate', datetime.now().isoformat() + 'Z'),
        'expirationDate': job_data.get('expirationDate', 'null'),
        'tags': job_data.get('tags', []),
        'status': 'pending_review', # All scraped jobs must be reviewed
        'jobLevel': f"{job_data.get('jobLevel', 'N/A')}",
        'employeeRole': f"{job_data.get('employeeRole', 'N/A')}",
        'salaryRange': f"{job_data.get('salaryRange', 'N/A')}",
        'source': f"{job_data.get('source', 'N/A')}",
    }

    # 5. Create the full file content
    content_body = job_data.get('description', '<p>No description provided.</p>')
    
    # Simple conversion of list-based responsibilities/qualifications to Markdown
    if job_data.get('responsibilities'):
        content_body += "\n\n### Responsibilities\n\n" + "\n".join([f"- {item}" for item in job_data['responsibilities']])
    if job_data.get('qualifications'):
        content_body += "\n\n### Qualifications\n\n" + "\n".join([f"- {item}" for item in job_data['qualifications']])


    frontmatter_str = "---\n"
    for key, value in frontmatter.items():
        if isinstance(value, list):
            if not value:
                frontmatter_str += f"{key}: []\n"
            else:
                frontmatter_str += f"{key}:\n"
                for item in value:
                    frontmatter_str += f'  - "{item}"\n'
        else:
            frontmatter_str += f"{key}: {value}\n"
    frontmatter_str += "---\n"

    full_content = f"{frontmatter_str}\n{content_body}"

    # 6. Write the file
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(full_content)
        print(f"  - Successfully saved job to: {filepath}")
    except IOError as e:
        print(f"  - ERROR: Could not write file {filepath}. Reason: {e}", file=sys.stderr)


# --- Main Pipeline Logic #

# Import scrapers after defining the save function
from .scrapers.rss_scraper import stream_rss_jobs
from .scrapers.foorilla_scraper import stream_foorilla_jobs, get_driver

def main():
    """Main function to orchestrate the entire data pipeline."""
    LOG_FILE = os.path.join(os.path.dirname(__file__), 'pipeline_run.log')

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    with open(LOG_FILE, 'w') as f:
        sys.stdout = f
        sys.stderr = f
        
        try:
            print("Starting pipeline run: Scrape and Save as Markdown...")
            driver = get_driver()
            
            try:
                # Define all job streams from different sources
                rss_stream = stream_rss_jobs() or []
                foorilla_stream = stream_foorilla_jobs(driver, limit=2)

                # Chain all data-yielding streams together
                all_raw_job_streams = itertools.chain(rss_stream, foorilla_stream)

                print("\n--- Scraping and Saving Jobs as Markdown Files ---")
                job_count = 0
                for raw_job in all_raw_job_streams:
                    print(f"  > Processing new job '{raw_job.get('title')}'...")
                    save_job_as_markdown(raw_job)
                    job_count += 1
                    time.sleep(1) # Small delay

                print(f"\nPipeline finished successfully. Saved {job_count} jobs for review.")

            except Exception as e:
                print(f"A critical error occurred in the main pipeline: {e}", file=sys.stderr)
            finally:
                print("Shutting down browser driver...")
                if driver:
                    driver.quit()
        finally:
            # Restore stdout and stderr
            sys.stdout = original_stdout
            sys.stderr = original_stderr
    
    print(f"Pipeline run complete. Output logged to {LOG_FILE}")

if __name__ == "__main__":
    main()