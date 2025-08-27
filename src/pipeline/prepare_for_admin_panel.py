import json
import argparse
import os
from datetime import datetime, timedelta

def transform_job_data(raw_job: dict, source_file: str) -> dict:
    """
    Transforms a single raw job dictionary from a scraper into the 
    structured format expected by the AI Job Spot admin panel.
    """
    # Generate a unique ID based on company and title to help prevent duplicates
    company_slug = raw_job.get('company', 'nocompany').lower().replace(' ', '-')
    title_slug = raw_job.get('title', 'notitle').lower().replace(' ', '-')
    unique_id = f"job-scraped-{company_slug}-{title_slug}"

    # Handle dates: use existing if valid, otherwise default to now
    try:
        posted_date_str = raw_job.get('postedDate')
        if posted_date_str:
            posted_date = datetime.fromisoformat(posted_date_str.replace('Z', ''))
        else:
            posted_date = datetime.utcnow()
    except (ValueError, TypeError):
        posted_date = datetime.utcnow()

    # Calculate expiration date based on posted date
    expiration_date = posted_date + timedelta(days=90)

    # Generate tags from available data
    tags = ["Scraped", "AI"]
    if raw_job.get('company'):
        tags.append(raw_job['company'])
    if raw_job.get('location'):
        # Simple location tag, could be improved with normalization
        tags.append(raw_job['location'].split(',')[0])

    # The description from the scrapers is already in HTML format
    description_html = raw_job.get('description', '<p>No description provided.</p>')

    prepared_job = {
        "id": unique_id,
        "title": raw_job.get('title', 'N/A'),
        "company": raw_job.get('company', 'N/A'),
        "location": raw_job.get('location', 'N/A'),
        "description": raw_job.get('summary', '<p>No description provided.</p>'), # Map summary to description
        "applicationLink": raw_job.get('link', '#'), # Use 'link' from raw_job
        "postedDate": posted_date.isoformat() + 'Z',  # ISO 8601 format
        "expirationDate": expiration_date.isoformat() + 'Z', # ISO 8601 format
        "salaryRange": raw_job.get('salaryRange', 'N/A'), # Map salaryRange
        "jobLevel": raw_job.get('jobLevel', 'N/A'), # Map jobLevel
        "employeeRole": raw_job.get('employeeRole', 'N/A'), # Map employeeRole
        "isNew": True,
        "tags": list(set(tags + raw_job.get('tags', []))), # Merge existing tags
        "source": os.path.basename(source_file), # Track the origin
        "responsibilities": raw_job.get('responsibilities', []), # Map responsibilities
        "qualifications": raw_job.get('qualifications', []), # Map qualifications
    }
    return prepared_job

def main():
    """
    Main function to read raw job files, transform them, and save the output.
    """
    parser = argparse.ArgumentParser(
        description="Reads raw JSON job data from scrapers, transforms it, and prepares it for the admin panel."
    )
    parser.add_argument(
        "input_files", 
        nargs='+', 
        help="One or more raw JSON files to process (e.g., foorilla_jobs.json hiring_cafe_jobs.json)."
    )
    parser.add_argument(
        "--output-file", 
        default="prepared_jobs_for_admin.json", 
        help="The name of the final JSON file to be created."
    )
    args = parser.parse_args()

    all_prepared_jobs = []
    processed_ids = set()

    print(f"Starting preparation process for: {', '.join(args.input_files)}")

    for file_path in args.input_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_jobs = json.load(f)
                print(f"Read {len(raw_jobs)} jobs from {file_path}.")
                
                for job in raw_jobs:
                    prepared_job = transform_job_data(job, file_path)
                    if prepared_job['id'] not in processed_ids:
                        all_prepared_jobs.append(prepared_job)
                        processed_ids.add(prepared_job['id'])
                    else:
                        print(f"Skipping duplicate job: {prepared_job['title']} at {prepared_job['company']}")

        except FileNotFoundError:
            print(f"Error: Input file not found at {file_path}")
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from {file_path}")

    if not all_prepared_jobs:
        print("No jobs were processed. Exiting.")
        return

    print(f"\nTotal unique jobs prepared: {len(all_prepared_jobs)}")

    try:
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(all_prepared_jobs, f, indent=2)
        print(f"✅ Successfully saved prepared jobs to {args.output_file}")
    except IOError as e:
        print(f"Error: Could not write to output file {args.output_file}. {e}")

if __name__ == "__main__":
    main()