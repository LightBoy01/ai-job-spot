import fs from 'fs/promises';
import path, { dirname } from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JOB_DIR = path.join(__dirname, '../src/job-descriptions');
const ARCHIVE_DIR = path.join(JOB_DIR, 'archive');
const STALE_THRESHOLD_MONTHS = 3;

import { normalizeCompanyName, normalizeJobTitle, normalizeLocation } from '../src/lib/normalization.js';

// Helper to normalize content for consistent hashing
function normalizeContent(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Helper to generate SHA-256 hash of content
function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(normalizeContent(content)).digest('hex');
}

// --- Sanitization Logic ---
async function sanitizeFiles() {
  console.log('--- Starting File Sanitization ---');
  let sanitizedCount = 0;
  const warnings: string[] = [];

  const files = await fs.readdir(JOB_DIR);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(JOB_DIR, file);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);

      let hasChanges = false;

      // Sanitize Frontmatter (only string values)
      const sanitizedFrontmatter: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(frontmatter)) {
        if (typeof value === 'string') {
          // Decode and then sanitize, similar to how it was done in writer.ts
          let cleanedValue = value;
          try {
            cleanedValue = decodeURIComponent(cleanedValue);
          } catch (e) {
            // Ignore decoding errors
          }
          cleanedValue = DOMPurify.sanitize(cleanedValue, { USE_PROFILES: { html: true } });
          cleanedValue = cleanedValue
            .replace(/<style[^>]*>.*<\/style>/gms, '')
            .replace(/<script[^>]*>.*<\/script>/gms, '')
            .replace(/<[^>]+>/g, '') // Strip remaining tags after DOMPurify if any
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();

          if (cleanedValue !== value) {
            hasChanges = true;
          }
          sanitizedFrontmatter[key] = cleanedValue;
        } else {
          sanitizedFrontmatter[key] = value;
        }
      }

      // Sanitize Body Content
      let cleanedContent = content;
      if (content && content.trim() !== '') {
        try {
          cleanedContent = decodeURIComponent(content);
        } catch (e) {
          // Ignore decoding errors
        }

        cleanedContent = DOMPurify.sanitize(cleanedContent, { USE_PROFILES: { html: true } });
        const newCleanedContent = cleanedContent
          .replace(/<style[^>]*>.*<\/style>/gms, '')
          .replace(/<script[^>]*>.*<\/script>/gms, '')
          .replace(/<[^>]+>/g, '\n') // Replace tags with newline for better readability
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s*\n+\s*/g, '\n') // Collapse multiple newlines/spaces
          .trim();

        if (newCleanedContent !== cleanedContent) {
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

  console.log(`Sanitization complete. Cleaned ${sanitizedCount} files.`);
  if (warnings.length > 0) {
    console.log('Sanitization warnings:');
    warnings.forEach(w => console.log(`- ${w}`));
  }
  console.log('----------------------------------\n');
}

// --- Archival Logic ---
interface JobFrontmatter {
  id: string;
  title?: string;
  company?: string;
  postedDate?: string;
  expirationDate?: string | null;
}

interface JobFileInfo {
  filePath: string;
  baseName: string;
  frontmatter: JobFrontmatter;
  postedTimestamp: number;
  contentHash?: string; // Added for content-based duplicate checking
}

async function archiveFiles() {
  console.log('--- Starting File Archival ---');
  const isDryRun = process.argv.includes('--dry-run');
  console.log(isDryRun ? 'Running in --dry-run mode. No files will be moved.' : 'Running in live mode.');

  const filesToArchive = new Map<string, { reason: string; fileInfo: JobFileInfo }>();
  const seenIds = new Map<string, JobFileInfo>(); // For ID-based duplicates
  const seenContentHashes = new Map<string, JobFileInfo>(); // For content-based duplicates
  const seenCombinedKeys = new Map<string, JobFileInfo>(); // For combined key duplicates

  let processedFileCount = 0;
  const warnings: string[] = [];

  const files = await fs.readdir(JOB_DIR);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(JOB_DIR, file);
    const fileInfo: Partial<JobFileInfo> = { filePath, baseName: file };

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContent);
      fileInfo.frontmatter = data as JobFrontmatter;

      if (!fileInfo.frontmatter.id || !fileInfo.frontmatter.title || !fileInfo.frontmatter.company) {
        warnings.push(`Skipping ${file}: Missing 'id', 'title', or 'company' in frontmatter.`);
        continue;
      }

      if (fileInfo.frontmatter.postedDate) {
        const parsedDate = new Date(fileInfo.frontmatter.postedDate);
        if (!isNaN(parsedDate.getTime())) {
          fileInfo.postedTimestamp = parsedDate.getTime();
        } else {
          warnings.push(`Skipping ${file}: Invalid 'postedDate': ${fileInfo.frontmatter.postedDate}`);
          continue;
        }
      } else {
        warnings.push(`Skipping ${file}: Missing 'postedDate'.`);
        continue;
      }

      // Generate content hash for content-based duplicate checking
      if (content && content.trim() !== '') {
        fileInfo.contentHash = generateContentHash(content);
      }

      processedFileCount++;

      // Skip files already marked for archival (from previous checks in this loop)
      if (filesToArchive.has(file)) continue;

      // 1. Expiration Check
      if (fileInfo.frontmatter.expirationDate) {
        const expiration = new Date(fileInfo.frontmatter.expirationDate);
        if (!isNaN(expiration.getTime()) && expiration < new Date()) {
          filesToArchive.set(file, { reason: 'Expired', fileInfo: fileInfo as JobFileInfo });
          continue;
        }
      }

      // 2. Staleness Check
      if (!fileInfo.frontmatter.expirationDate && fileInfo.postedTimestamp) {
        const staleDate = new Date();
        staleDate.setMonth(staleDate.getMonth() - STALE_THRESHOLD_MONTHS);
        if (fileInfo.postedTimestamp < staleDate.getTime()) {
          filesToArchive.set(file, { reason: `Stale (posted over ${STALE_THRESHOLD_MONTHS} months ago)`, fileInfo: fileInfo as JobFileInfo });
          continue;
        }
      }

      // 3. ID-based Duplicate Check (first pass)
      const existingIdFile = seenIds.get(fileInfo.frontmatter.id);
      if (existingIdFile) {
        if (fileInfo.postedTimestamp > existingIdFile.postedTimestamp) {
          filesToArchive.set(existingIdFile.baseName, { reason: `Duplicate ID (newer version found: ${file})`, fileInfo: existingIdFile });
          seenIds.set(fileInfo.frontmatter.id, fileInfo as JobFileInfo); // Replace with the newer file
        } else {
          filesToArchive.set(file, { reason: `Duplicate ID (older than or same as: ${existingIdFile.baseName})`, fileInfo: fileInfo as JobFileInfo });
        }
        continue; // Move to next file after handling ID duplicate
      } else {
        seenIds.set(fileInfo.frontmatter.id, fileInfo as JobFileInfo);
      }

      // 4. Content-based Duplicate Check (second pass, only if not an ID duplicate)
      if (fileInfo.contentHash) {
        const existingContentFile = seenContentHashes.get(fileInfo.contentHash);
        if (existingContentFile) {
          if (fileInfo.postedTimestamp > existingContentFile.postedTimestamp) {
            filesToArchive.set(existingContentFile.baseName, { reason: `Duplicate Content (newer version found: ${file})`, fileInfo: existingContentFile });
            seenContentHashes.set(fileInfo.contentHash, fileInfo as JobFileInfo); // Replace with the newer file
          } else {
            filesToArchive.set(file, { reason: `Duplicate Content (older than or same as: ${existingContentFile.baseName})`, fileInfo: fileInfo as JobFileInfo });
          }
          continue; // Move to next file after handling content duplicate
        } else {
          seenContentHashes.set(fileInfo.contentHash, fileInfo as JobFileInfo);
        }
      }

      // 5. Combined Key Duplicate Check (third pass, only if not an ID or Content duplicate)
      const normalizedCompany = normalizeCompanyName(fileInfo.frontmatter.company || '');
      const normalizedTitle = normalizeJobTitle(fileInfo.frontmatter.title || '');
      const normalizedLocation = normalizeLocation(fileInfo.frontmatter.location || ''); // Assuming 'location' exists in frontmatter
      const combinedKey = `${normalizedCompany}-${normalizedTitle}-${normalizedLocation}`;

      if (combinedKey !== '--') { // Avoid empty combined keys
        const existingCombinedKeyFile = seenCombinedKeys.get(combinedKey);
        if (existingCombinedKeyFile) {
          if (fileInfo.postedTimestamp > existingCombinedKeyFile.postedTimestamp) {
            filesToArchive.set(existingCombinedKeyFile.baseName, { reason: `Duplicate Combined Key (newer version found: ${file})`, fileInfo: existingCombinedKeyFile });
            seenCombinedKeys.set(combinedKey, fileInfo as JobFileInfo); // Replace with the newer file
          } else {
            filesToArchive.set(file, { reason: `Duplicate Combined Key (older than or same as: ${existingCombinedKeyFile.baseName})`, fileInfo: fileInfo as JobFileInfo });
          }
          continue; // Move to next file after handling combined key duplicate
        } else {
          seenCombinedKeys.set(combinedKey, fileInfo as JobFileInfo);
        }
      }

    } catch (e) {
      warnings.push(`Error processing ${file}: ${(e as Error).message}`);
    }
  }

  // 5. Archive Files
  console.log('\n--- Archival Report ---');
  if (filesToArchive.size === 0) {
    console.log('No files need to be archived.');
  }
  else {
    console.log(`Found ${filesToArchive.size} files to archive:\n`);
    for (const [fileName, { reason }] of filesToArchive) {
      console.log(`- ${fileName}: ${reason}`);
    }

    if (!isDryRun) {
      console.log('\nArchiving files...');
      for (const [fileName, { fileInfo }] of filesToArchive) {
        const oldPath = fileInfo.filePath;
        const newPath = path.join(ARCHIVE_DIR, fileInfo.baseName);
        try {
          await fs.rename(oldPath, newPath);
        } catch (e: any) {
          warnings.push(`Failed to archive ${fileName}: ${e.message}`);
        }
      }
      console.log('Archival complete.');
    }
  }

  console.log(`\nProcessed ${processedFileCount} archival candidates.`);
  if (warnings.length > 0) {
    console.log(`\nEncountered ${warnings.length} archival warnings:`);
    warnings.forEach(w => console.log(`- ${w}`));
  }
}

async function main() {
  try {
    await sanitizeFiles();
    await archiveFiles();
  } catch (error) {
    console.error('An unexpected error occurred in main:', (error as Error).message);
  }
}

main();
