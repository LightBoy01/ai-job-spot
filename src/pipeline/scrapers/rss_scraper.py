import feedparser
import sys
import os
from ..models import Job
from datetime import datetime

def stream_rss_jobs(config: dict):
    rss_config = config.get('rss_scraper_config', {})
    feeds = rss_config.get('RSS_FEEDS', [])
    if not feeds:
        print("Warning: No RSS feeds configured.", file=sys.stderr)
        return
    print("Processing RSS feeds...")
    for url in feeds:
        print(f"  - Fetching RSS from {url}")
        feed = feedparser.parse(url)
        for entry in feed.entries:
            yield Job(
                id="", # Will be generated in run_pipeline.py
                title=entry.title,
                company=entry.get('author', 'N/A'),
                location="", # Not available in RSS feed
                description=entry.summary,
                applicationLink=entry.link,
                postedDate=entry.get('published', datetime.now()),
                source=feed.feed.title if hasattr(feed.feed, 'title') else url,
            )
