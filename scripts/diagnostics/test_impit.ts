
import { Impit } from 'impit';
import logger from '../../src/data-pipeline/utils/logger.js';

/**
 * This script is a diagnostic tool to test the functionality of the `impit` library
 * in the current environment. It attempts to fetch a real-world target to verify
 * that `impit` can be instantiated and can successfully bypass basic browser checks.
 */
async function testImpit() {
  logger.info('[impit-test] Starting impit diagnostic test...');

  try {
    // 1. Instantiate Impit, impersonating a Chrome browser.
    logger.info('[impit-test] Instantiating Impit with Chrome browser profile...');
    const impit = new Impit({
        browser: "chrome",
        ignoreTlsErrors: false, // Explicitly disable for security
    });
    logger.info('[impit-test] Impit instantiated successfully.');

    const targetUrl = 'https://hiring.cafe/api/search-jobs';
    logger.info({ url: targetUrl }, '[impit-test] Attempting to fetch target URL...');

    // 2. Use the `fetch` method to make the request.
    const response = await impit.fetch(targetUrl);
    logger.info({ status: response.status }, '[impit-test] Received response.');

    // 3. Log the response headers to see what we got back.
    const headers: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });
    logger.info({ headers }, '[impit-test] Response headers:');

    // 4. Log a snippet of the response body.
    const body = await response.text();
    logger.info(`[impit-test] Response body snippet: ${body.substring(0, 500)}...`);

    if (response.status === 200 && body.length > 100) {
        logger.info('[impit-test] SUCCESS: Impit test completed successfully.');
    } else {
        logger.error('[impit-test] FAILURE: Received a non-200 status or empty body.');
    }

  } catch (error) {
    logger.error({ err: error }, '[impit-test] FAILURE: An error occurred during the impit test.');
    process.exit(1);
  }
}

testImpit();
