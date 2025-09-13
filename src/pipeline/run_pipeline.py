import os
import subprocess
import sys
import json

def main():
    """Main function to orchestrate the data pipeline with real-time and file-based logging."""
    pipeline_dir = os.path.dirname(__file__)
    os.chdir(pipeline_dir)

    log_file_path = "pipeline_run.log"

    # Load configuration
    try:
        with open("pipeline_config.json", 'r', encoding='utf-8') as f:
            config = json.load(f)
        scrapers_enabled = config.get("scrapers_enabled", [])
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading or parsing pipeline_config.json: {e}", file=sys.stderr)
        sys.exit(1)

    # Determine which spiders to run based on the config
    spiders_to_run = []
    for scraper_name in scrapers_enabled:
        if scraper_name == "foorilla_scraper":
            spiders_to_run.append("foorilla")
        # NOTE: The 'rss_scraper' is not a Scrapy spider and is not run by this script.

    if not spiders_to_run:
        print("No enabled Scrapy spiders found in configuration. Exiting.", file=sys.stderr)
        sys.exit(0)

    try:
        with open(log_file_path, 'w', encoding='utf-8', buffering=1) as log_file:
            log_file.write("---" + "-" * 10 + " Starting pipeline run " + "-" * 10 + "---" + "\n")
            log_file.write(f"Enabled spiders to run: {spiders_to_run}" + "\n")

            for spider in spiders_to_run:
                print(f"--- Running spider: {spider} ---")
                log_file.write(f"--- Running spider: {spider} ---\n")

                process = subprocess.Popen(
                    [sys.executable, "-m", "scrapy", "crawl", spider],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    universal_newlines=True
                )

                if process.stdout:
                    for line in iter(process.stdout.readline, ''):
                        print(line, end='')      # Real-time to console
                        log_file.write(line)    # Write to log file

                process.wait()

                if process.returncode != 0:
                    error_msg = f"\n--- Scrapy spider '{spider}' failed with exit code {process.returncode} ---\n"
                    print(error_msg, file=sys.stderr)
                    log_file.write(error_msg)
                    sys.exit(process.returncode)

                success_msg = f"\n--- Spider '{spider}' finished successfully. ---\n"
                print(success_msg)
                log_file.write(success_msg)

    except FileNotFoundError:
        err = "Error: 'scrapy' command not found. Make sure Scrapy is installed and in your PATH."
        print(err, file=sys.stderr)
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\n{err}\n")
        sys.exit(1)
    except Exception as e:
        err = f"An unexpected error occurred: {e}"
        print(err, file=sys.stderr)
        import traceback
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\n{err}\n")
            traceback.print_exc(file=log_file)
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
