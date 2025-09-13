import os
import subprocess
import sys
import json
import logging
import traceback

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
        print(f"DEBUG: Loaded config: {config}")
        print(f"DEBUG: Scrapers enabled: {scrapers_enabled}")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading or parsing pipeline_config.json: {e}", file=sys.stderr)
        sys.exit(1)

    # Filter out non-scrapy runners from the enabled scrapers list.
    spiders_to_run = [s["name"] for s in scrapers_enabled if s["name"] != 'rss_scraper']
    print(f"DEBUG: Spiders to run: {spiders_to_run}")

    if not spiders_to_run:
        print("No enabled Scrapy spiders found in configuration. Exiting.", file=sys.stderr)
        sys.exit(0)

    try:
        with open(log_file_path, 'w', encoding='utf-8', buffering=1) as log_file:
            log_file.write("---" + "-" * 10 + " Starting pipeline run " + "-" * 10 + "---\n")
            log_file.write(f"Enabled spiders to run: {spiders_to_run}\n")

            for spider_name in spiders_to_run:
                print(f"--- Running spider: {spider_name} ---\n")
                log_file.write(f"--- Running spider: {spider_name} ---\n")

                # Get the specific site configuration for the current spider
                site_config = next((s for s in scrapers_enabled if s["name"] == spider_name), None)
                if not site_config:
                    logging.error(f"Configuration for spider '{spider_name}' not found in pipeline_config.json. Skipping.")
                    continue

                scrapy_settings = []
                # Pass the entire spider-specific config as a single JSON string
                if 'spider_config' in site_config:
                    scrapy_settings.append(f"-s SPIDER_CONFIG={json.dumps(site_config['spider_config'])}")

                # Pass global filter keywords
                if "global_filter_keywords" in config:
                    scrapy_settings.append(f"-s GLOBAL_FILTER_KEYWORDS={json.dumps(config['global_filter_keywords'])}")

                # Pass scraper limits
                spider_limit_key = f"{site_config.get('spider_name', spider_name)}_scraper_limit"
                if "scraper_limits" in config and spider_limit_key in config["scraper_limits"]:
                    scrapy_settings.append(f"-s CLOSESPIDER_ITEMCOUNT={config['scraper_limits'][spider_limit_key]}")

                # Pass output directory
                if "output_directory" in config:
                    scrapy_settings.append(f"-s MARKDOWN_OUTPUT_DIR={config['output_directory']}")

                command = [
                    sys.executable, "-m", "scrapy", "crawl", spider_name,
                    "--loglevel", "INFO" 
                ] + scrapy_settings

                project_dir = os.path.join(pipeline_dir, 'job_scraper')

                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    universal_newlines=True,
                    cwd=project_dir
                )

                if process.stdout:
                    for line in iter(process.stdout.readline, ''):
                        print(line, end='')
                        log_file.write(line)

                process.wait()

                if process.returncode != 0:
                    error_msg = f"\n--- Scrapy spider '{spider_name}' failed with exit code {process.returncode} ---\n"
                    print(error_msg, file=sys.stderr)
                    log_file.write(error_msg)
                else:
                    success_msg = f"\n--- Spider '{spider_name}' finished successfully. ---\n"
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

    logging.info("--- AI Job Spot Data Pipeline Finished ---")