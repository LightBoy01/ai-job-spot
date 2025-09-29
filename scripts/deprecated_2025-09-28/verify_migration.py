import os
import glob

def verify_frontmatter(directory):
    invalid_files = []
    files = glob.glob(os.path.join(directory, '*.md'))
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            if not content.startswith('---\n'):
                invalid_files.append(file_path)
        except Exception as e:
            invalid_files.append(f"{file_path} (Error: {e})")
    return len(files), len(files) - len(invalid_files), invalid_files

article_total, article_valid, article_invalid = verify_frontmatter('src/articles')
job_total, job_valid, job_invalid = verify_frontmatter('src/job-descriptions')

print(f"Article Verification: {article_valid}/{article_total} files contain frontmatter.")
if article_invalid:
    print(f"Invalid article files: {article_invalid}")

print(f"Job Verification: {job_valid}/{job_total} files contain frontmatter.")
if job_invalid:
    print(f"Invalid job files: {job_invalid}")

if not article_invalid and not job_invalid:
    print('\nData integrity check PASSED for all files.')
else:
    print('\nData integrity check FAILED.')
