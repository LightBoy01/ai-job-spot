import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { Source } from '../lib/types.js';
import { fetchAndParseRss, RssItem } from './adapters/rss-adapter.js';

const BRIEFINGS_DIR = path.resolve(process.cwd(), 'src', 'content', 'briefings');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'archive');

function generateBriefingId(originalUrl: string): string {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('hex');
  return `briefing-${hash}`;
}

async function getLocalBriefingFilePaths(sourceName: string): Promise<Map<string, string>> {
  const localBriefings = new Map<string, string>();
  try {
    const files = await fs.readdir(BRIEFINGS_DIR);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(BRIEFINGS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);

        if (data.sourceName === sourceName && data.id) {
          localBriefings.set(data.id, filePath);
        }
      } catch (readError) {}
    }
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`[Briefings Processor] Warning: Could not read briefings directory.`);
    }
  }
  return localBriefings;
}

export async function processBriefingSource(source: Source, isDryRun: boolean) {
  console.log(`\n[Processing] Briefing Source: ${source.sourceName}`);

  try {
    let items: RssItem[] = [];
    if (source.adapter === 'RSS' && source.feedUrl) {
      items = await fetchAndParseRss(source.feedUrl);
    } else {
      console.warn(`  - Skipping source '${source.sourceName}': Unsupported adapter or missing feedUrl.`);
      return;
    }
    console.log(`  > Fetched ${items.length} items from source.`);

    const localBriefings = await getLocalBriefingFilePaths(source.sourceName);
    const remoteBriefingIds = new Set(items.map(item => generateBriefingId(item.link)));
    let archivedCount = 0;

    for (const [localId, localPath] of localBriefings.entries()) {
      if (!remoteBriefingIds.has(localId)) {
        const archivePath = path.join(ARCHIVE_DIR, path.basename(localPath));
        if (!isDryRun) {
          await fs.rename(localPath, archivePath);
        } else {
          console.log(`[DRY RUN] Would archive stale briefing: ${localPath} to ${archivePath}.`);
        }
        archivedCount++;
      }
    }
    if (archivedCount > 0) {
      console.log(`  > Archived ${archivedCount} stale briefing(s).`);
    }

    let createdCount = 0;
    for (const item of items) {
      const briefingId = generateBriefingId(item.link);
      const filePath = path.join(BRIEFINGS_DIR, `${briefingId}.md`);

      try {
        await fs.access(filePath);
        continue;
      } catch (e) {}

      const frontmatter = {
        id: briefingId,
        title: item.title,
        slug: briefingId,
        author: item.creator || source.sourceName,
        publishDate: item.isoDate ? new Date(item.isoDate) : new Date(),
        contentType: 'briefing',
        sourceName: source.sourceName,
        originalUrl: item.link,
        status: (item.contentSnippet || item.content) ? 'pending_review' : 'content_incomplete',
        tags: item.categories || [],
        excerpt: item.contentSnippet?.substring(0, 200) || item.content?.substring(0, 200) || ''
      };

      if (frontmatter.status === 'content_incomplete') {
        frontmatter.tags.push('needs-content-review');
      }

      const warningComment = `<!-- WARNING: AUTO-GENERATED FILE. DO NOT EDIT. -->`;
      const fileContentWithWarning = matter.stringify(item.content || '', frontmatter);
      const finalContent = `${warningComment}\n\n${fileContentWithWarning}`;
      if (!isDryRun) {
        await fs.writeFile(filePath, finalContent, 'utf-8');
      } else {
        console.log(`[DRY RUN] Would create new briefing file: ${filePath}.`);
      }
      createdCount++;
    }
    if (createdCount > 0) {
      console.log(`  + Created ${createdCount} new briefing file(s).`);
    }

  } catch (error) {
    console.error(`! Failed to process source ${source.sourceName}:`, error);
  }
}
