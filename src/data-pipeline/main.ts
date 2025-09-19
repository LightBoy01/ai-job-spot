import { PlaywrightCrawler, Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { WriteStream } from 'fs';

import { FoorillaParser } from './parsers/foorilla_parser';
import { IParser } from './parsers/base_parser';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The structure of a scraped job item, similar to items.py
export interface JobItem {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  applicationLink: string;
  postedDate?: string;
  tags: string[];
  status: 'pending_review';
  jobLevel?: string;
  employeeRole?: string;
  salaryRange?: string;
  source?: string;
  responsibilities: string[];
  qualifications: string[];
}

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

async function writeMarkdownFile(item: JobItem, outputDir: string, log: (message: string) => void) {
    const frontmatter = {
        id: item.id,
        title: item.title,
        company: item.company,
        location: item.location,
        applicationLink: item.applicationLink,
        postedDate: item.postedDate,
        expirationDate: null, // To be set manually
        tags: item.tags,
        status: item.status,
        jobLevel: item.jobLevel,
        employeeRole: item.employeeRole,
        salaryRange: item.salaryRange,
        source: item.source,
    };

    const yamlFrontmatter = yaml.dump(frontmatter);
    const fullContent = `---\n${yamlFrontmatter}---\n
${item.description}`;

    const companySlug = slugify(item.company || 'nocompany');
    const titleSlug = slugify(item.title || 'notitle').substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `job-scraped-${companySlug}-${titleSlug}-${timestamp}.md`;
    const filepath = path.join(outputDir, filename);

    try {
        await fsPromises.writeFile(filepath, fullContent, 'utf-8');
        log(`Successfully saved job to: ${filepath}`);
    } catch (error) {
        log(`Could not write file ${filepath}. Reason: ${error}`);
    }
}

async function loadExistingUrls(dirs: string[]): Promise<Set<string>> {
    const existingUrls = new Set<string>();
    for (const dir of dirs) {
        try {
            const files = await fsPromises.readdir(dir);
            for (const file of files) {
                if (path.extname(file) === '.md') {
                    const filePath = path.join(dir, file);
                    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
                    const { data } = matter(fileContent);
                    if (data.applicationLink) {
                        existingUrls.add(data.applicationLink);
                    }
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.warn(`Warning: Could not read directory ${dir}. It may not exist yet.`);
            }
        }
    }
    return existingUrls;
}


// Main function to orchestrate the scraping process
async function main() {
  const logStream = fs.createWriteStream('pipeline_run.log', { flags: 'a' });
  const log = (message: string, ...optionalParams: unknown[]) => {
      const logMessage = `${new Date().toISOString()}: ${message} ${optionalParams.join(' ')}`;
      logStream.write(logMessage + '\n');
      process.stdout.write(logMessage + '\n');
  };
  const errorLog = (message: string, ...optionalParams: unknown[]) => {
      const logMessage = `${new Date().toISOString()}: ERROR: ${message} ${optionalParams.join(' ')}`;
      logStream.write(logMessage + '\n');
      process.stderr.write(logMessage + '\n');
  };

  log('Starting the new Node.js scraping pipeline...');

  try {
    // 1. Load Configuration
    const projectRoot = path.resolve(__dirname, '../..');
    const configPath = path.join(projectRoot, 'src/pipeline/pipeline_config.json');
    const configBuffer = await fsPromises.readFile(configPath);
    const config = JSON.parse(configBuffer.toString());
    const scrapersToRun = config.scrapers_enabled || [];
    const outputDir = path.join(projectRoot, config.output_directory);
    await fsPromises.mkdir(outputDir, { recursive: true }); // Ensure output directory exists

    // 2. Load existing URLs to prevent duplicates
    const jobDescDir = path.join(projectRoot, 'src/job-descriptions');
    const pendingReviewDir = path.join(projectRoot, 'data/pending_review');
    const existingUrls = await loadExistingUrls([jobDescDir, pendingReviewDir]);
    log(`Found ${existingUrls.size} existing job URLs to check against.`);

    // 3. Loop through each enabled scraper and run it
    for (const scraperConfig of scrapersToRun) {
      log(`--- Running scraper: ${scraperConfig.name} ---`);

      const spiderConfig = scraperConfig.spider_config;
      const aiNiches: string[] = spiderConfig.ai_niches || [];

      const isRelevantJob = (title: string): boolean => {
        if (aiNiches.length === 0) return true; // If no niches are defined, all jobs are relevant
        const titleLower = title.toLowerCase();
        return aiNiches.some(niche => titleLower.includes(niche.toLowerCase()));
      };

      const crawler = new PlaywrightCrawler({
        async requestHandler({ request, page, crawler }) {
          log(`Processing page: ${request.url}`);

          if (request.label === 'LIST') {
            // Logic for the job listing page
            log('Parsing as a LIST page.');
            const listSelector = `${spiderConfig.job_list_selector} ${spiderConfig.job_link_selector}`;
            await page.waitForSelector(listSelector, { timeout: 20000 });

            const jobLinks = await page.locator(listSelector).all();
            log(`Found ${jobLinks.length} potential job links.`);

            for (const link of jobLinks) {
              const title = await link.innerText();
              if (isRelevantJob(title)) {
                const href = await link.getAttribute('href') || await link.getAttribute('hx-get');
                if (href) {
                  const absoluteUrl = new URL(href, request.loadedUrl).href;
                  log(`Enqueuing relevant job for detail scraping: "${title}" at ${absoluteUrl}`);
                  // This is now a Playwright request to find the *real* application link
                  await crawler.addRequests([{ 
                    url: absoluteUrl,
                    label: 'DETAIL',
                    userData: { title },
                  }]);
                }
              }
            }

            // Implement pagination logic
            const { pageNumber } = request.userData;
            const maxPages = config.scraper_limits[`${scraperConfig.spider_name}_scraper_limit`] || 1;

            if (pageNumber < maxPages) {
              const paginationSelector = spiderConfig.pagination?.selector;
              if (spiderConfig.pagination?.type === 'htmx' && paginationSelector) {
                const nextPageElement = page.locator(paginationSelector);
                const nextPageHref = await nextPageElement.getAttribute('hx-get');

                if (nextPageHref) {
                  const nextUrl = new URL(nextPageHref, request.loadedUrl).href;
                  log(`Found next page link: ${nextUrl}`);
                  await crawler.addRequests([{ 
                    url: nextUrl,
                    label: 'LIST',
                    userData: { pageNumber: pageNumber + 1 },
                  }]);
                } else {
                  log('No more next page links found. Stopping pagination.');
                }
              } else {
                log('Pagination not configured or type is not htmx. Stopping.');
              }
            } else {
              log(`Max page limit (${maxPages}) reached. Stopping pagination.`);
            }

          } else if (request.label === 'DETAIL') {
            if (existingUrls.has(request.url)) {
                log(`Skipping duplicate job (already exists): ${request.url}`);
                return;
            }

            log(`Scraping details for job: "${request.userData.title}" from ${request.url}`);
            
            const response = await gotScraping.get({ url: request.url });
            const htmlBody = response.body;
            const $ = cheerio.load(htmlBody);

            // --- Select and instantiate the correct parser ---
            // This is where a factory or switch statement would go if we had more parsers
            const parser: IParser = new FoorillaParser();
            const parsedDetails = parser.parse(htmlBody);

            // --- Basic data extraction using Cheerio (can also be moved to parser) ---
            const title = $('h1').first().text().trim();
            const company = $('div.hstack strong a').first().text().trim();
            const locationText = $('div.hstack > div:first-child').text().trim();
            const location = locationText.split('\n')[0].trim();
            const externalLink = $('a:contains("Apply Now")').attr('href') || $('a:contains("Apply")').attr('href');

            // --- Metadata extraction (can also be moved to parser) ---
            const metadataText = locationText;
            const bracketedTerms = metadataText.match(/\[(.*?)\]/g) || [];
            const jobLevelKeywords = ['entry', 'mid-level', 'senior', 'lead', 'principal', 'intermediate'];
            const roleKeywords = ['full time', 'part time', 'contract', 'internship'];
            let jobLevel: string | undefined;
            let employeeRole: string | undefined;

            bracketedTerms.forEach(term => {
                const termLower = term.toLowerCase();
                if (jobLevelKeywords.some(k => termLower.includes(k))) jobLevel = term.replace(/\[|\]/g, '');
                if (roleKeywords.some(k => termLower.includes(k))) employeeRole = term.replace(/\[|\]/g, '');
            });

            const salaryMatch = metadataText.match(/(USD|CAD) [0-9,K]+(-[0-9,K]+)?/);
            const salaryRange = salaryMatch ? salaryMatch[0] : undefined;

            const companySlug = slugify(company || 'nocompany');
            const titleSlug = slugify(title || 'notitle').substring(0, 50);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            const jobItem: JobItem = {
                id: `job-scraped-${companySlug}-${titleSlug}-${timestamp}`,
                title: title || request.userData.title,
                company: company,
                location: location,
                description: parsedDetails.description || '',
                applicationLink: externalLink || request.url,
                postedDate: new Date().toISOString(),
                tags: [],
                status: 'pending_review',
                jobLevel: jobLevel,
                employeeRole: employeeRole,
                salaryRange: salaryRange,
                source: scraperConfig.name,
                responsibilities: parsedDetails.responsibilities,
                qualifications: parsedDetails.qualifications,
            };

            // Add to cache before writing to prevent duplicates in the same run
            existingUrls.add(request.url);

            log(`Successfully parsed job item. Writing to file...`);
            await writeMarkdownFile(jobItem, outputDir, log);
          }
        },

        failedRequestHandler({ request }) {
          errorLog(`Request ${request.url} failed.`);
        },
      });

      // Add the starting URL to the crawler's queue
      await crawler.addRequests([
        {
          url: spiderConfig.start_url,
          label: 'LIST',
          // Label to distinguish list pages from detail pages
          userData: { pageNumber: 1 },
        },
      ]);

      // Run the crawler and wait for it to finish
      await crawler.run();

      log(`--- Finished scraper: ${scraperConfig.name} ---`);
    }

    log('Pipeline execution finished.');

  } catch (error) {
    errorLog(`An error occurred during the pipeline execution: ${error}`);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Execute the main function
main();
