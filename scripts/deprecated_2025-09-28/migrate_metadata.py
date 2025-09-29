import re
import json
import os
from datetime import datetime

# --- CONFIGURATION ---
SEED_FILE_PATH = 'seedFirestore.ts'
ARTICLES_DIR = 'src/articles'
JOBS_DIR = 'src/job-descriptions'

# --- UTILITY FUNCTIONS ---

def extract_data_array(file_content, array_name):
    """Extracts a TypeScript array from the file content using regex."""
    # This regex is designed to find "const array_name: Type[] = [" and capture the array content.
    pattern = re.compile(f'const {array_name}:[\\w\\s\\[\\]]+ = (\\[.*\\]);\\n', re.DOTALL)
    match = pattern.search(file_content)
    if not match:
        raise ValueError(f"Could not find the '{array_name}' array in the seed file.")
    
    # The captured group is a string that looks like a JSON array but with JS specific syntax.
    array_string = match.group(1)
    
    # Convert JS-specific syntax to valid JSON
    # 1. Replace single quotes with double quotes
    json_string = array_string.replace("'", '"')
    # 2. Remove trailing commas from the last element in an object
    json_string = re.sub(r',(\s*?)\}', r'\1}', json_string)
    json_string = re.sub(r',(\s*?)\]', r'\1]', json_string)
    # 3. Add quotes around keys
    json_string = re.sub(r'(\s*?)([a-zA-Z0-9_]+):(?!=http|https)', r'\1"\2":', json_string)
    # 4. Handle Firestore Timestamps by capturing the date string
    json_string = re.sub(r'admin\.firestore\.Timestamp\.fromDate\(new Date\("(.*?)"\)\)', r'"\1"', json_string)

    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON for {array_name}:")
        print(json_string) # Print the problematic string for debugging
        raise e

def create_yaml_frontmatter(metadata, fields_to_exclude):
    """Creates a YAML frontmatter string from a dictionary."""
    lines = ['---']
    for key, value in metadata.items():
        if key in fields_to_exclude:
            continue
        
        if value is None:
            lines.append(f'{key}: null')
        elif isinstance(value, list):
            if not value:
                lines.append(f'{key}: []')
            else:
                lines.append(f'{key}:')
                for item in value:
                    lines.append(f'  - "{item}"')
        elif isinstance(value, str) and ':' in value and 'T' in value:
             # Attempt to format date strings consistently
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                lines.append(f'{key}: "{dt.isoformat()}"')
            except ValueError:
                 lines.append(f'{key}: "{value}"')
        else:
            lines.append(f'{key}: "{value}"')
    lines.append('---')
    return '\n'.join(lines) + '\n\n'

# --- MAIN LOGIC ---

def main():
    """Main function to run the migration."""
    print(f"Reading seed data from {SEED_FILE_PATH}...")
    with open(SEED_FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract data
    articles_data = extract_data_array(content, 'articles')
    jobs_data = extract_data_array(content, 'jobs')
    print(f"Found {len(articles_data)} articles and {len(jobs_data)} jobs in the seed file.")

    # --- Migrate Articles ---
    print("\nMigrating metadata for articles...")
    for article in articles_data:
        markdown_file = article.get('markdownFile')
        if not markdown_file:
            print(f"Skipping article with no markdownFile: {article.get('title')}")
            continue
        
        file_path = os.path.join(ARTICLES_DIR, markdown_file)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                md_content = f.read()
            
            # Check if frontmatter already exists
            if md_content.strip().startswith('---'):
                print(f"Skipping {markdown_file}, frontmatter already exists.")
                continue

            frontmatter = create_yaml_frontmatter(article, ['contentBody'])
            new_content = frontmatter + md_content
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully migrated metadata to {markdown_file}")
        else:
            print(f"Warning: Markdown file not found for article: {markdown_file}")

    # --- Migrate Jobs ---
    print("\nMigrating metadata for jobs...")
    for job in jobs_data:
        markdown_file = job.get('markdownFile')
        if not markdown_file:
            print(f"Skipping job with no markdownFile: {job.get('title')}")
            continue
        
        file_path = os.path.join(JOBS_DIR, markdown_file)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                md_content = f.read()

            if md_content.strip().startswith('---'):
                print(f"Skipping {markdown_file}, frontmatter already exists.")
                continue

            frontmatter = create_yaml_frontmatter(job, ['description', 'responsibilities', 'qualifications', 'preferredQualifications'])
            new_content = frontmatter + md_content
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully migrated metadata to {markdown_file}")
        else:
            print(f"Warning: Markdown file not found for job: {markdown_file}")

    print("\nMigration complete!")

if __name__ == '__main__':
    main()