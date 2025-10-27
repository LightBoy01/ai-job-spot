
import { gotScraping, Options } from 'got-scraping';
import { JSDOM } from 'jsdom';

/**
 * Fetches the HTML content of a URL using got-scraping to mimic a real browser.
 *
 * @param url The URL to fetch.
 * @param options Optional got-scraping options to override defaults.
 * @returns The parsed JSDOM object of the page.
 * @throws An error if the request fails or returns a non-success status code.
 */
export async function fetchPageAsDom(
  url: string,
  options?: Options
): Promise<JSDOM> {
  try {
    const response = await gotScraping({
      url,
      ...options,
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `Request failed with status code ${response.statusCode} for URL: ${url}`
      );
    }

    return new JSDOM(response.body);
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error fetching URL: ${url}`, {
      errorMessage: err.message,
      stack: err.stack,
    });
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Fetches the raw body content of a URL.
 *
 * @param url The URL to fetch.
 * @param options Optional got-scraping options.
 * @returns The response body as a string.
 */
export async function fetchPageSource(
  url: string,
  options?: Options
): Promise<string> {
  try {
    const response = await gotScraping({
      url,
      ...options,
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `Request failed with status code ${response.statusCode} for URL: ${url}`
      );
    }

    return response.body;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error fetching URL: ${url}`, {
      errorMessage: err.message,
      stack: err.stack,
    });
    throw error;
  }
}
