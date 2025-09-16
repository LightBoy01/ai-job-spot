import sqlite3
import os
import re
import yaml
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem
from datetime import datetime, timedelta
import nh3

class DuplicatesPipeline:

    def __init__(self):
        self.conn = None

    def open_spider(self, spider):
        db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'pipeline_cache.db')
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS seen_jobs (
                url TEXT PRIMARY KEY,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        if self.conn:
            self.prune_old_urls(spider) # Pass spider instance
            self.conn.close()

    def process_item(self, item, spider):
        if self.is_url_seen(str(item.applicationLink)):
            raise DropItem(f"Duplicate item found: {item.title}")
        else:
            self.add_url_to_db(str(item.applicationLink))
            return item

    def is_url_seen(self, url: str) -> bool:
        self.cursor.execute("SELECT 1 FROM seen_jobs WHERE url = ?", (url,))
        return self.cursor.fetchone() is not None

    def add_url_to_db(self, url: str):
        self.cursor.execute("INSERT INTO seen_jobs (url) VALUES (?)", (url,))
        self.conn.commit()

    def prune_old_urls(self, spider):
        """Removes URLs older than 6 months from the database."""
        six_months_ago = datetime.now() - timedelta(days=180)
        self.cursor.execute("DELETE FROM seen_jobs WHERE scraped_at < ?", (six_months_ago,))
        self.conn.commit()
        spider.logger.info(f"Pruned old URLs from the database.")

class MarkdownWriterPipeline:
    def __init__(self, output_dir):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            output_dir=crawler.settings.get('MARKDOWN_OUTPUT_DIR')
        )

    def process_item(self, item, spider):
        company_slug = re.sub(r'[^a-z0-9]+', '-', (item.company or 'nocompany').lower()).strip('-')
        title_slug = re.sub(r'[^a-z0-9]+', '-', (item.title or 'notitle').lower()).strip('-')[:50]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"job-scraped-{company_slug}-{title_slug}-{timestamp}.md"
        filepath = os.path.join(self.output_dir, filename)

        job_id = f"job-scraped-{company_slug}-{title_slug}"

        frontmatter = {
            'id': job_id,
            'title': item.title or None,
            'company': item.company or None,
            'location': item.location or None,
            'applicationLink': str(item.applicationLink),
            'postedDate': item.postedDate.isoformat() + 'Z' if item.postedDate else datetime.now().isoformat() + 'Z',
            'expirationDate': item.expirationDate.isoformat() + 'Z' if item.expirationDate else None,
            'tags': item.tags or [],
            'status': 'pending_review',
            'jobLevel': item.jobLevel or None,
            'employeeRole': item.employeeRole or None,
            'salaryRange': item.salaryRange or None,
            'source': item.source or None,
        }

        # Sanitize the description HTML before writing
        description_html = item.description or '<p>No description provided.</p>'
        # Use a stricter sanitization profile to prevent XSS
        sanitized_description = nh3.clean(
            description_html,
            tags={'p', 'br', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'},
            attributes={
                'a': {'href', 'rel'},  # Allow href and rel on links
                '*': {}  # Disallow all attributes on all other tags
            },
            strip_comments=True,
            link_rel='noopener noreferrer'  # Add rel attribute to all links
        )
        content_body = sanitized_description
        
        frontmatter_yaml = yaml.dump(frontmatter, sort_keys=False, default_flow_style=False, allow_unicode=True)
        full_content = f"---\n{frontmatter_yaml}---\n\n{content_body}"

        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_content)
            spider.logger.info(f"Successfully saved job to: {filepath}")
        except IOError as e:
            spider.logger.error(f"Could not write file {filepath}. Reason: {e}")

        return item