import feedparser
import sys
import os

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
            yield {
                'source': feed.feed.title if hasattr(feed.feed, 'title') else url,
                'title': entry.title,
                'company': entry.get('author', 'N/A'),
                'link': entry.link,
                'summary': entry.summary,
                'description': entry.summary,
                'postedDate': entry.get('published')
            }
