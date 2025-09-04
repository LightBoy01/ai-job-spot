import os
import subprocess
import sys

def main():
    """Main function to orchestrate the entire data pipeline."""
    # Change directory to the pipeline directory so scrapy can find its config
    pipeline_dir = os.path.dirname(__file__)
    os.chdir(pipeline_dir)

    # Get the list of enabled scrapers from the config
    # For now, we only have one, but this is for future expansion
    spiders_to_run = ["foorilla"] # In the future, this could be read from pipeline_config.json

    for spider in spiders_to_run:
        print(f"--- Running spider: {spider} ---")
        try:
            # We run scrapy as a subprocess
            # The command needs to be run from within the `pipeline` directory
            process = subprocess.run(
                [sys.executable, "-m", "scrapy", "crawl", spider],
                capture_output=True,
                text=True,
                check=True # This will raise a CalledProcessError if Scrapy exits with a non-zero code
            )
            print(process.stdout)
            if process.stderr:
                print("--- Scrapy Stderr ---", file=sys.stderr)
                print(process.stderr, file=sys.stderr)

        except FileNotFoundError:
            print(f"Error: 'scrapy' command not found. Make sure Scrapy is installed and in your PATH.", file=sys.stderr)
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"Scrapy spider '{spider}' failed with exit code {e.returncode}", file=sys.stderr)
            print("--- Scrapy Stdout ---", file=sys.stderr)
            print(e.stdout, file=sys.stderr)
            print("--- Scrapy Stderr ---", file=sys.stderr)
            print(e.stderr, file=sys.stderr)
            # We exit with a non-zero code to fail the GitHub Action
            sys.exit(1)

    print("\nPipeline finished successfully.")

if __name__ == "__main__":
    main()
