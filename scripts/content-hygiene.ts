import fs from 'fs/promises';
import path, { dirname } from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../src/lib/normalization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Generic Helper Functions ---

function normalizeContent(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(normalizeContent(content)).digest('hex');
}

// --- Configuration ---

const CONFIG = {
  jobs: {
    dir: path.join(__dirname, '../src/job-descriptions'),
    archiveDir: path.join(__dirname, '../src/job-descriptions', 'archive'),
    staleThresholdMonths: 3,
    dateField: 'postedDate',
    requiredFields: ['id', 'title', 'company', 'postedDate'],
    duplicateChecks: {
        id: true,
        content: true,
        combinedKey: (fm: Record<string, unknown>) => {
            const company = normalizeCompanyName(fm.company as string || '');
            const title = normalizeJobTitle(fm.title as string || '');
            const location = normalizeLocation(fm.location as string || '');
            return `${company}-${title}-${location}`;
        }
    }
  },
  briefings: {
    dir: path.join(__dirname, '../src/content/briefings'),
    archiveDir: path.join(__dirname, '../src/content/briefings', 'archive'),
    staleThresholdDays: 30, // Briefings have a shorter shelf life
    dateField: 'publishDate',
    requiredFields: ['id', 'title', 'publishDate', 'originalUrl'],
    duplicateChecks: {
        id: true,
        content: false, // Content can be similar (e.g., summaries), so we rely on URL
        combinedKey: (fm: Record<string, unknown>) => fm.originalUrl // The original URL is the strongest unique identifier
    }
  },
};

type ContentType = keyof typeof CONFIG;

// --- Validation Logic ---

function validateContent(
  frontmatter: Record<string, any>,
  content: string,
  contentType: ContentType
): string[] {
  const warnings: string[] = [];
  const config = CONFIG[contentType];

  // 1. Title Validation
  if (frontmatter.title) {
    const title = frontmatter.title as string;
    // 1a. Title Length Check
    if (title.length > 100) {
      warnings.push(`Title exceeds 100 characters (${title.length})`);
    }
    // 1b. Title Redundancy Check
    const salaryKeywords = /€|\$|salary|bonus|tantieme|vergütung/i;
    if (salaryKeywords.test(title)) {
      warnings.push('Title appears to contain redundant salary information.');
    }
  }

  // 2. Content Body Validation
  if (content) {
    // 2a. Placeholder Check
    const placeholderKeywords = /lorem ipsum|\[insert.*?\]/i;
    if (placeholderKeywords.test(content)) {
      warnings.push('Content body may contain placeholder text.');
    }
    // 2b. Unbroken String Check
    const longWordThreshold = 50;
    const longWordRegex = new RegExp(`\b\w{${longWordThreshold},}\b`, 'g');
    const longWords = content.match(longWordRegex);
    if (longWords) {
      warnings.push(
        `Content body contains very long, unbroken strings (e.g., "${longWords[0].substring(0, 20)}...").`
      );
    }
  }

  // 3. Metadata Completeness (specific to jobs)
  if (contentType === 'jobs') {
    if (!frontmatter.companyLogoUrl) {
      warnings.push('Missing recommended field: companyLogoUrl.');
    }
    if (!frontmatter.salaryRange) {
      warnings.push('Missing recommended field: salaryRange.');
    }
  }

  return warnings;
}

/**
 * Applies automatic corrections to the title field of the frontmatter.
 * @param frontmatter The original frontmatter object.
 * @returns An object containing the corrected frontmatter and a boolean indicating if changes were made.
 */
function applyTitleCorrections(frontmatter: Record<string, any>): { correctedFrontmatter: Record<string, any>; hasChanges: boolean } {
  let hasChanges = false;
  const correctedFrontmatter = { ...frontmatter };

  if (typeof correctedFrontmatter.title === 'string') {
    let cleanedTitle = correctedFrontmatter.title;

    // 1. Remove redundant salary information
    const salaryKeywords = /€|\$|salary|bonus|tantieme|vergütung/i;
    if (salaryKeywords.test(cleanedTitle)) {
      cleanedTitle = cleanedTitle.replace(salaryKeywords, '').trim();
      if (cleanedTitle !== correctedFrontmatter.title) {
        hasChanges = true;
      }
    }

    // 2. Truncate long titles
    if (cleanedTitle.length > 100) {
      cleanedTitle = cleanedTitle.substring(0, 97) + '...';
      if (cleanedTitle !== correctedFrontmatter.title) {
        hasChanges = true;
      }
    }
    correctedFrontmatter.title = cleanedTitle;
  }

  return { correctedFrontmatter, hasChanges };
}

// --- Sanitization Logic ---

async function sanitizeFiles(contentType: ContentType) {
  const config = CONFIG[contentType];
  console.log(`--- Starting File Sanitization & Validation for ${contentType} ---`);
  let sanitizedCount = 0;
  const validationWarnings: { [fileName: string]: string[] } = {};

  try {
    await fs.mkdir(config.dir, { recursive: true });
    const files = await fs.readdir(config.dir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(config.dir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data: frontmatter, content } = matter(fileContent);

        let currentFrontmatter = { ...frontmatter };
        let currentContent = content;
        let hasChanges = false;

        // Apply automatic title corrections
        const { correctedFrontmatter, hasChanges: titleCorrectionsMade } = applyTitleCorrections(currentFrontmatter);
        if (titleCorrectionsMade) {
          currentFrontmatter = correctedFrontmatter;
          hasChanges = true;
        }

        // Run validation logic on potentially modified frontmatter
        const fileWarnings = validateContent(currentFrontmatter, currentContent, contentType);
        if (fileWarnings.length > 0) {
          validationWarnings[file] = fileWarnings;
        }

        // Sanitize Frontmatter (general sanitization)
        const sanitizedFrontmatter: { [key: string]: unknown } = {};
        for (const [key, value] of Object.entries(currentFrontmatter)) {
          if (typeof value === 'string') {
            let cleanedValue = value;
            try {
              cleanedValue = decodeURIComponent(cleanedValue);
            } catch (e) { /* Ignore */ }
            cleanedValue = DOMPurify.sanitize(cleanedValue, { USE_PROFILES: { html: true } })
              .replace(/<[^>]+>/g, '').trim();
            if (cleanedValue !== value) hasChanges = true;
            sanitizedFrontmatter[key] = cleanedValue;
          } else {
            sanitizedFrontmatter[key] = value;
          }
        }

        // Sanitize Body Content
        let cleanedContent = currentContent;
        if (currentContent && currentContent.trim() !== '') {
            const newCleanedContent = DOMPurify.sanitize(currentContent, { USE_PROFILES: { html: true } });
            if (newCleanedContent !== currentContent) {
                hasChanges = true;
                cleanedContent = newCleanedContent;
            }
        }

        if (hasChanges) {
          const newFileContent = matter.stringify(cleanedContent, sanitizedFrontmatter);
          await fs.writeFile(filePath, newFileContent, 'utf8');
          sanitizedCount++;
        }
      } catch (e) {
        validationWarnings[file] = [`Failed to process file: ${(e as Error).message}`];
      }
    }

    console.log(`Sanitization complete. Cleaned ${sanitizedCount} files.`);
    if (Object.keys(validationWarnings).length > 0) {
      console.log('\n--- Content Hygiene Report ---');
      for (const [fileName, warnings] of Object.entries(validationWarnings)) {
        console.log(`[WARNING] ${fileName}:`);
        warnings.forEach(w => console.log(`  - ${w}`));
      }
      console.log('------------------------------');
    } else {
      console.log('All files passed content hygiene checks.');
    }
  } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Error during sanitization for ${contentType}:`, (e as Error).message);
      }
  }
  console.log('----------------------------------\n');
}

// --- Archival Logic ---

interface FileInfo {
  filePath: string;
  baseName: string;
  frontmatter: Record<string, unknown>;
  dateTimestamp: number;
  contentHash?: string;
}

async function archiveFiles(contentType: ContentType, isDryRun: boolean) {
  const config = CONFIG[contentType];
  console.log(`--- Starting File Archival for ${contentType} ---`);
  console.log(isDryRun ? 'Running in --dry-run mode. No files will be moved.' : 'Running in live mode.');

  const filesToArchive = new Map<string, { reason: string; fileInfo: FileInfo }>();
  const seenIds = new Map<string, FileInfo>();
  const seenContentHashes = new Map<string, FileInfo>();
  const seenCombinedKeys = new Map<string, FileInfo>();

  let processedFileCount = 0;
  const warnings: string[] = [];

  try {
    await fs.mkdir(config.archiveDir, { recursive: true });
    const files = await fs.readdir(config.dir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(config.dir, file);
      const fileInfo: Partial<FileInfo> = { filePath, baseName: file };

      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);
        fileInfo.frontmatter = data;

        if (!fileInfo.frontmatter) {
          warnings.push(`Skipping ${file}: Missing frontmatter.`);
          continue;
        }
        const frontmatter = fileInfo.frontmatter;
        if (!config.requiredFields.every(field => frontmatter[field])) {
          warnings.push(`Skipping ${file}: Missing one or more required fields: ${config.requiredFields.join(', ')}`);
          continue;
        }

        const parsedDate = new Date(fileInfo.frontmatter[config.dateField] as string);
        if (isNaN(parsedDate.getTime())) {
          warnings.push(`Skipping ${file}: Invalid date in field '${config.dateField}'`);
          continue;
        }
        fileInfo.dateTimestamp = parsedDate.getTime();

        if (config.duplicateChecks.content && content && content.trim() !== '') {
          fileInfo.contentHash = generateContentHash(content);
        }

        processedFileCount++;
        const completeFileInfo = fileInfo as FileInfo;

        if (filesToArchive.has(file)) continue;

        // 1. Expiration Check (specific to jobs)
        if (contentType === 'jobs' && completeFileInfo.frontmatter.expirationDate) {
          const expiration = new Date(completeFileInfo.frontmatter.expirationDate as string);
          if (!isNaN(expiration.getTime()) && expiration < new Date()) {
            filesToArchive.set(file, { reason: 'Expired', fileInfo: completeFileInfo });
            continue;
          }
        }

        // 2. Staleness Check
        const staleDate = new Date();
        let isStale = false;
        let reason = '';

        if ('staleThresholdDays' in config && typeof (config as { staleThresholdDays?: number }).staleThresholdDays === 'number') {
            staleDate.setDate(staleDate.getDate() - (config as { staleThresholdDays?: number }).staleThresholdDays!);
            if (completeFileInfo.dateTimestamp < staleDate.getTime()) {
                isStale = true;
                reason = `Stale (date is over ${(config as { staleThresholdDays?: number }).staleThresholdDays} days ago)`;
            }
        } else if ('staleThresholdMonths' in config && typeof (config as { staleThresholdMonths?: number }).staleThresholdMonths === 'number') {
            staleDate.setMonth(staleDate.getMonth() - (config as { staleThresholdMonths?: number }).staleThresholdMonths!);
            if (completeFileInfo.dateTimestamp < staleDate.getTime()) {
                isStale = true;
                reason = `Stale (date is over ${(config as { staleThresholdMonths?: number }).staleThresholdMonths} months ago)`;
            }
        }

        if (isStale) {
          filesToArchive.set(file, { reason, fileInfo: completeFileInfo });
          continue;
        }

        // 3. Duplicate Checks
        const checks = [
            { name: 'ID', map: seenIds, key: completeFileInfo.frontmatter.id, enabled: config.duplicateChecks.id },
            { name: 'Content', map: seenContentHashes, key: completeFileInfo.contentHash, enabled: config.duplicateChecks.content },
            { name: 'Combined Key', map: seenCombinedKeys, key: config.duplicateChecks.combinedKey(completeFileInfo.frontmatter), enabled: true },
        ];

        let isDuplicate = false;
        for (const check of checks) {
            if (!check.enabled || !check.key) continue;

            const existingFile = check.map.get(check.key as string);
            if (existingFile) {
                if (completeFileInfo.dateTimestamp > existingFile.dateTimestamp) {
                    filesToArchive.set(existingFile.baseName, { reason: `Duplicate ${check.name} (newer version found: ${file})`, fileInfo: existingFile });
                    check.map.set(check.key as string, completeFileInfo); // Replace with the newer file
                } else {
                    filesToArchive.set(file, { reason: `Duplicate ${check.name} (older than or same as: ${existingFile.baseName})`, fileInfo: completeFileInfo });
                }
                isDuplicate = true;
                break; // Stop checking once a duplicate is found and handled
            } else {
                check.map.set(check.key as string, completeFileInfo);
            }
        }
        if (isDuplicate) continue;

      } catch (e) {
        warnings.push(`Error processing ${file}: ${(e as Error).message}`);
      }
    }

    // 5. Archive Files
    console.log(`
--- Archival Report for ${contentType} ---`);
    if (filesToArchive.size === 0) {
      console.log('No files need to be archived.');
    } else {
      console.log(`Found ${filesToArchive.size} files to archive:\n`);
      for (const [fileName, { reason }] of filesToArchive) {
        console.log(`- ${fileName}: ${reason}`);
      }

      if (!isDryRun) {
        console.log('\nArchiving files...');
        for (const [, { fileInfo }] of filesToArchive) {
          const oldPath = fileInfo.filePath;
          const newPath = path.join(config.archiveDir, fileInfo.baseName);
          try {
            await fs.rename(oldPath, newPath);
          } catch (e: unknown) {
            warnings.push(`Failed to archive ${fileInfo.baseName}: ${(e as Error).message}`);
          }
        }
        console.log('Archival complete.');
      }
    }

    console.log(`\nProcessed ${processedFileCount} archival candidates for ${contentType}.`);
    if (warnings.length > 0) {
      console.log(`\nEncountered ${warnings.length} archival warnings:`);
      warnings.forEach(w => console.log(`- ${w}`));
    }

  } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error during archival for ${contentType}:`, (e as Error).message);
      }
  }
}

// --- Main Execution ---

export async function runHygiene(contentType: ContentType, isDryRun: boolean) {
  if (!contentType || !CONFIG[contentType]) {
    console.error("Please specify a valid content type: 'jobs' or 'briefings'.");
    process.exit(1);
  }

  try {
    await sanitizeFiles(contentType);
    await archiveFiles(contentType, isDryRun);
  } catch (error) {
    console.error(`An unexpected error occurred in main for ${contentType}:`, (error as Error).message);
  }
}

async function main() {
  const contentType = process.argv[2] as ContentType;
  const isDryRun = process.argv.includes('--dry-run');
  
  await runHygiene(contentType, isDryRun);
}

if (process.env.NODE_ENV !== 'test') {
    main();
}