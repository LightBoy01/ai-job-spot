import sqlite3
import os
import re
import yaml
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem
from datetime import datetime

class DuplicatesPipeline:

    def __init__(self):
        self.conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), '..', '..', 'pipeline_cache.db'))
        self.cursor = self.conn.cursor()

    def open_spider(self, spider):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS seen_jobs (
                url TEXT PRIMARY KEY,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.close()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        if self.is_url_seen(adapter['applicationLink']):
            raise DropItem(f"Duplicate item found: {adapter['title']}")
        else:
            self.add_url_to_db(adapter['applicationLink'])
            return item

    def is_url_seen(self, url: str) -> bool:
        self.cursor.execute("SELECT 1 FROM seen_jobs WHERE url = ?", (url,))
        return self.cursor.fetchone() is not None

    def add_url_to_db(self, url: str):
        self.cursor.execute("INSERT INTO seen_jobs (url) VALUES (?)", (url,))
        self.conn.commit()

class MarkdownWriterPipeline:
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        output_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'pending_review')
        os.makedirs(output_dir, exist_ok=True)

        company_slug = re.sub(r'[^a-z0-9]+', '-', adapter.get('company', 'nocompany').lower()).strip('-')
        title_slug = re.sub(r'[^a-z0-9]+', '-', adapter.get('title', 'notitle').lower()).strip('-')[:50]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"job-scraped-{company_slug}-{title_slug}-{timestamp}.md"
        filepath = os.path.join(output_dir, filename)

        job_id = f"job-scraped-{company_slug}-{title_slug}"

        frontmatter = {
            'id': job_id,
            'title': adapter.get('title', 'N/A'),
            'company': adapter.get('company', 'N/A'),
            'location': adapter.get('location', 'N/A'),
            'applicationLink': adapter.get('applicationLink', '#'),
            'postedDate': adapter.get('postedDate', datetime.now().isoformat() + 'Z'),
            'expirationDate': adapter.get('expirationDate', None),
            'tags': adapter.get('tags', []),
            'status': 'pending_review',
            'jobLevel': adapter.get('jobLevel', 'N/A'),
            'employeeRole': adapter.get('employeeRole', 'N/A'),
            'salaryRange': adapter.get('salaryRange', 'N/A'),
            'source': adapter.get('source', 'N/A'),
            'isNew': adapter.get('isNew', True),
        }

        content_body = adapter.get('description', '<p>No description provided.</p>')
        
        frontmatter_yaml = yaml.dump(frontmatter, sort_keys=False, default_flow_style=False, allow_unicode=True)
        full_content = f"---\n{frontmatter_yaml}---\n\n{content_body}"

        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_content)
            spider.logger.info(f"Successfully saved job to: {filepath}")
        except IOError as e:
            spider.logger.error(f"Could not write file {filepath}. Reason: {e}")

        return item
