
import feedparser
import json
from datetime import datetime
import time
import sys
import argparse

def load_config(config_path: str) -> dict:
    """Loads a JSON configuration file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {config_path}", file=sys.stderr)
        sys.exit(1)

def is_relevant(title, ai_niches):
    return any(n.lower() in title.lower() for n in ai_niches)

def parse_feed(feed_url, ai_niches):
    jobs = []
    feed = feedparser.parse(feed_url)
    for entry in feed.entries:
        if hasattr(entry, 'title') and is_relevant(entry.title, ai_niches):
            # Convert published date to datetime object for calculation
            published_date_str = entry.get('published', time.strftime('%Y-%m-%dT%H:%M:%SZ', entry.get('published_parsed', time.gmtime())))
            try:
                # Attempt to parse various date formats
                if 'T' in published_date_str: # ISO format
                    published_datetime = datetime.fromisoformat(published_date_str.replace('Z', '+00:00'))
                elif 'GMT' in published_date_str or 'UTC' in published_date_str: # RFC 1123 format
                    published_datetime = datetime.strptime(published_date_str, '%a, %d %b %Y %H:%M:%S %Z')
                else: # Fallback for other formats, might need more specific parsing
                    published_datetime = datetime.strptime(published_date_str, '%Y-%m-%d %H:%M:%S') # Common format
            except ValueError:
                published_datetime = datetime.now() # Fallback to current time if parsing fails

            expiration_datetime = published_datetime + timedelta(days=30)

            job = {
                'title': entry.title,
                'applicationLink': entry.link, # Map RSS link to applicationLink
                'description': entry.summary, # Use summary as description
                'postedDate': published_datetime.isoformat() + 'Z',
                'expirationDate': expiration_datetime.isoformat() + 'Z',
                'company': 'N/A', # Default value
                'location': 'N/A', # Default value
                'responsibilities': [], # Default empty list
                'qualifications': [], # Default empty list
                'jobLevel': 'N/A', # Default value
                'employeeRole': 'N/A', # Default value
                'salaryRange': 'N/A', # Default value
                'tags': [], # Default empty list
                'source': feed.feed.title if hasattr(feed.feed, 'title') else 'Unknown'
            }
            jobs.append(job)
    return jobs

def main():
    parser = argparse.ArgumentParser(description="Aggregate job data from RSS feeds.")
    parser.add_argument("--config", type=str, default="src/pipeline/config/rss_config.json", help="Path to the RSS configuration file.")
    args = parser.parse_args()

    config = load_config(args.config)
    rss_feeds = config.get("RSS_FEEDS", [])
    ai_niches = config.get("AI_NICHES", [])
    output_filename = config.get("output_filename", "rss_jobs.json")

    all_jobs = []
    for url in rss_feeds:
        print(f"Parsing feed: {url}")
        all_jobs.extend(parse_feed(url, ai_niches))
    
    with open(f'src/pipeline/output/{output_filename}', 'w') as f:
        json.dump(all_jobs, f, indent=4)
        
    print(f"Found and saved {len(all_jobs)} relevant jobs.")

if __name__ == "__main__":
    main()
