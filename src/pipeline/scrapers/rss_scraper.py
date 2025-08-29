import json
import feedparser
import sys
import os

def stream_rss_jobs(config_path='src/pipeline/config/rss_config.json'):
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Warning: RSS config file not found at {config_path}", file=sys.stderr)
        return
    feeds = config.get('RSS_FEEDS', [])
    if not feeds: return
    print("Processing RSS feeds...")
    for url in feeds:
        print(f"  - Fetching RSS from {url}")
        feed = feedparser.parse(url)
        for entry in feed.entries:
            yield {
                'source': feed.feed.title if hasattr(feed.feed, 'title') else url,
                'title': entry.title,
                'company': entry.get('author', 'N/A'),
                'link': entry.link,
                'summary': entry.summary,
                'description': entry.summary,
                'postedDate': entry.get('published')
            }
