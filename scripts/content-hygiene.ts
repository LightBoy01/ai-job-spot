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
        combinedKey: (fm: any) => {
            const company = normalizeCompanyName(fm.company || '');
            const title = normalizeJobTitle(fm.title || '');
            const location = normalizeLocation(fm.location || '');
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
        combinedKey: (fm: any) => fm.originalUrl // The original URL is the strongest unique identifier
    }
  },
};

type ContentType = keyof typeof CONFIG;

// --- Sanitization Logic ---

async function sanitizeFiles(contentType: ContentType) {
  const config = CONFIG[contentType];
  console.log(`--- Starting File Sanitization for ${contentType} ---`);
  let sanitizedCount = 0;
  const warnings: string[] = [];

  try {
    await fs.mkdir(config.dir, { recursive: true });
    const files = await fs.readdir(config.dir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(config.dir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data: frontmatter, content } = matter(fileContent);

        let hasChanges = false;

        // Sanitize Frontmatter
        const sanitizedFrontmatter: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(frontmatter)) {
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
        let cleanedContent = content;
        if (content && content.trim() !== '') {
            const newCleanedContent = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
            if (newCleanedContent !== content) {
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
        warnings.push(`Failed to sanitize ${file}: ${(e as Error).message}`);
      }
    }

    console.log(`Sanitization complete for ${contentType}. Cleaned ${sanitizedCount} files.`);
    if (warnings.length > 0) {
      console.log('Sanitization warnings:');
      warnings.forEach(w => console.log(`- ${w}`));
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
  frontmatter: any;
  dateTimestamp: number;
  contentHash?: string;
}

async function archiveFiles(contentType: ContentType) {
  const config = CONFIG[contentType];
  console.log(`--- Starting File Archival for ${contentType} ---`);
  const isDryRun = process.argv.includes('--dry-run');
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

        if (!config.requiredFields.every(field => fileInfo.frontmatter[field])) {
          warnings.push(`Skipping ${file}: Missing one or more required fields: ${config.requiredFields.join(', ')}`);
          continue;
        }

        const parsedDate = new Date(fileInfo.frontmatter[config.dateField]);
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
          const expiration = new Date(completeFileInfo.frontmatter.expirationDate);
          if (!isNaN(expiration.getTime()) && expiration < new Date()) {
            filesToArchive.set(file, { reason: 'Expired', fileInfo: completeFileInfo });
            continue;
          }
        }

        // 2. Staleness Check
        const staleDate = new Date();
        if (config.staleThresholdDays) {
            staleDate.setDate(staleDate.getDate() - config.staleThresholdDays);
        } else if (config.staleThresholdMonths) {
            staleDate.setMonth(staleDate.getMonth() - config.staleThresholdMonths);
        }

        if (completeFileInfo.dateTimestamp < staleDate.getTime()) {
          const reason = `Stale (date is over ${config.staleThresholdDays || config.staleThresholdMonths} ${config.staleThresholdDays ? 'days' : 'months'} ago)`;
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

            const existingFile = check.map.get(check.key);
            if (existingFile) {
                if (completeFileInfo.dateTimestamp > existingFile.dateTimestamp) {
                    filesToArchive.set(existingFile.baseName, { reason: `Duplicate ${check.name} (newer version found: ${file})`, fileInfo: existingFile });
                    check.map.set(check.key, completeFileInfo); // Replace with the newer file
                } else {
                    filesToArchive.set(file, { reason: `Duplicate ${check.name} (older than or same as: ${existingFile.baseName})`, fileInfo: completeFileInfo });
                }
                isDuplicate = true;
                break; // Stop checking once a duplicate is found and handled
            } else {
                check.map.set(check.key, completeFileInfo);
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
          } catch (e: any) {
            warnings.push(`Failed to archive ${fileInfo.baseName}: ${e.message}`);
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

async function main() {
  const contentType = process.argv[2] as ContentType;
  if (!contentType || !CONFIG[contentType]) {
    console.error("Please specify a valid content type: 'jobs' or 'briefings'.");
    console.error("Usage: ts-node scripts/content-hygiene.ts <jobs|briefings> [--dry-run]");
    process.exit(1);
  }

  try {
    await sanitizeFiles(contentType);
    await archiveFiles(contentType);
  } catch (error) {
    console.error(`An unexpected error occurred in main for ${contentType}:`, (error as Error).message);
  }
}

main();