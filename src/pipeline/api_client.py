import os
import requests
import json
import logging
import sys

# --- Logging for failed submissions ---
FAILED_SUBMISSIONS_LOG = os.path.join(os.path.dirname(__file__), 'failed_submissions.log')
failed_logger = logging.getLogger('failed_submissions')
failed_logger.setLevel(logging.ERROR)
file_handler = logging.FileHandler(FAILED_SUBMISSIONS_LOG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
failed_logger.addHandler(file_handler)

def send_to_ingest_api(job_data: dict, config: dict, method: str = 'POST'):
    """Sends a job data payload to the secure ingest API."""
    ingest_url = f"{config['API_BASE_URL']}/api/pipeline/ingest"
    api_key = os.getenv('PIPELINE_API_KEY')

    if not api_key:
        print("Error: PIPELINE_API_KEY environment variable not set.", file=sys.stderr)
        print("DEBUG: PIPELINE_API_KEY is NOT set.", file=sys.stderr)
        return

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    print(f"DEBUG: Sending headers: {headers}", file=sys.stderr)

    try:
        # Prepare the request to inspect it
        req = requests.Request('POST', ingest_url, headers=headers, json=job_data)
        prepared_req = req.prepare()

        print(f"  - Sending '{job_data.get('title')}' to {ingest_url}")
        print(f"  - DEBUG: Request method: {prepared_req.method}") # Explicitly log the method

        with requests.Session() as session:
            response = session.send(prepared_req, timeout=30)

        response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
        print(f"    - Success: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"    - Error sending job to API: {e}", file=sys.stderr)
        if e.response:
            print(f"    - API Response: {e.response.text}", file=sys.stderr)
        # Log failed job data
        failed_logger.error(f"Failed to send job: {json.dumps(job_data)} - Error: {e}")
