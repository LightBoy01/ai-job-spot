import { gotScraping } from 'got-scraping';
import TurndownService from 'turndown';
import { spawn } from 'child_process';
import path from 'path';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { logger } from '../utils/logger.js';
function runSelenium(url, pythonScriptPath) {
    return new Promise((resolve, reject) => {
        const process = spawn('python3', [pythonScriptPath, url]);
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => (stdout += data.toString()));
        process.stderr.on('data', (data) => (stderr += data.toString()));
        process.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Selenium script exited with code ${code}: ${stderr}`));
            }
            resolve(stdout);
        });
        process.on('error', (err) => {
            reject(new Error(`Failed to start Selenium script: ${err.message}`));
        });
    });
}
/**
 * Fetches an article URL, using a Python/Selenium fallback for dynamic pages,
 * parses the main content, and converts it to clean Markdown.
 *
 * @param url The URL of the article to parse.
 * @returns A promise that resolves to the article content in Markdown format.
 */
export async function fetchAndParseArticle(url) {
    let html = '';
    const pythonScriptPath = path.resolve(process.cwd(), 'scripts', 'scraping', 'get_dynamic_page_source_selenium.py');
    try {
        logger.info(`[Article Parser] Fetching with lightweight client: ${url}`);
        const response = await gotScraping({ url, timeout: { response: 15000 } });
        html = response.body;
        if (html.includes('Enable JavaScript and cookies to continue') || html.includes('__cf_chl_opt')) {
            logger.warn(`[Article Parser] Cloudflare detected. Falling back to Selenium for ${url}.`);
            html = await runSelenium(url, pythonScriptPath);
        }
    }
    catch (error) {
        logger.error(`[Article Parser] Lightweight client failed for ${url}. Falling back to Selenium.`);
        try {
            html = await runSelenium(url, pythonScriptPath);
        }
        catch (execError) {
            const message = execError instanceof Error ? execError.message : String(execError);
            logger.error(`[Article Parser] Selenium script execution failed for ${url}:`, message);
            throw new Error(`Both lightweight and Selenium methods failed to fetch ${url}`);
        }
    }
    try {
        logger.info(`[Article Parser] Parsing content with Readability...`);
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        if (!article || !article.content || article.content.length < 100) {
            throw new Error('Could not extract article content using Readability.');
        }
        const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
        logger.info(`[Article Parser] Converting HTML to Markdown...`);
        const markdown = turndownService.turndown(article.content);
        if (!markdown || markdown.trim().length < 100) {
            throw new Error(`Generated markdown for ${url} is too short, likely indicating a failed scrape.`);
        }
        return `# ${article.title}\n\n${markdown}`;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[Article Parser] Error processing ${url}:`, message);
        throw error;
    }
}
