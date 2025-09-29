
import re
import os

seed_file_path = '/data/data/com.termux/files/home/ai-job-spot/seedFirestore.js'
articles_dir = '/data/data/com.termux/files/home/ai-job-spot/src/articles'

def read_seed_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: Seed file not found at {path}")
        return None

def create_markdown_files(content):
    # This regex is designed to be non-greedy and find individual JS objects
    article_object_regex = re.compile(r"{\s*slug:.*?}.*?`.*?`.*?},", re.DOTALL)
    
    # More specific regex for the properties within an object
    slug_regex = re.compile(r"slug: '([\w-]+)',")
    content_body_regex = re.compile(r"contentBody: `(.*?)`", re.DOTALL)

    # Find all article objects first
    articles_array_str_match = re.search(r"const articles = \[(.*)\];", content, re.DOTALL)
    if not articles_array_str_match:
        print("Could not find 'const articles' array.")
        return

    articles_array_str = articles_array_str_match.group(1)
    
    # Find individual objects within the array string
    individual_articles = re.findall(r"{\s*slug:[^}]+}", articles_array_str)
    files_created_count = 0

    for article_str in individual_articles:
        content_match = content_body_regex.search(article_str)
        if content_match:
            slug_match = slug_regex.search(article_str)
            if slug_match:
                slug = slug_match.group(1)
                content_body = content_match.group(1).strip()
                md_filename = f"{slug}.md"
                md_filepath = os.path.join(articles_dir, md_filename)

                try:
                    with open(md_filepath, 'w', encoding='utf-8') as f:
                        f.write(content_body)
                    print(f"Successfully created: {md_filepath}")
                    files_created_count += 1
                except IOError as e:
                    print(f"Error writing file {md_filepath}: {e}")
    
    print(f"\n--- Finished. {files_created_count} markdown files created. ---")

def main():
    print("--- Starting Article File Creation ---")
    original_content = read_seed_file(seed_file_path)
    if not original_content:
        return

    create_markdown_files(original_content)

if __name__ == "__main__":
    main()
