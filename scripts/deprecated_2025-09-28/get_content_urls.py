import requests
import bs4
import sys

def get_job_content_urls(url: str, num_urls: int = 5):
    """
    Fetches the main job board page and extracts the direct HTMX content URLs.
    """
    print(f"Fetching main job list from: {url}")
    try:
        response = requests.get(url, timeout=15.0)
        response.raise_for_status() # Raise an exception for bad status codes
    except requests.RequestException as e:
        print(f"Error: Could not fetch URL {url}. Reason: {e}", file=sys.stderr)
        sys.exit(1)

    soup = bs4.BeautifulSoup(response.text, 'lxml')
    
    link_selector = "li.list-group-item a.stretched-link"
    links = soup.select(link_selector)
    
    if not links:
        print(f"Error: Could not find any job links using the selector '{link_selector}'", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(links)} total job links. Extracting the top {num_urls}.")
    
    content_urls = []
    for link in links[:num_urls]:
        hx_get_url = link.get('hx-get')
        if hx_get_url:
            content_urls.append(hx_get_url)
    
    return content_urls

if __name__ == "__main__":
    target_url = "https://foorilla.com/hiring/jobs/top/"
    urls = get_job_content_urls(target_url)
    
    if urls:
        print("\n--- Found Direct Content URLs ---")
        for url in urls:
            print(url)
        print("\nSuccessfully extracted content URLs.")
    else:
        print("\nCould not find any content URLs.", file=sys.stderr)
        sys.exit(1)
