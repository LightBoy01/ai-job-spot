import { Article, Job } from './schemas.js';

// Define a more comprehensive type for items that generateUniqueId can handle
type PipelineItem = (Article | Job) & {
  id?: string;
  applicationLink?: string;
};

/**
 * Generates a unique and consistent ID for an item.
 * Strategy: Use the item's `guid` if available, otherwise fall back to the `link` or `id` or `applicationLink`.
 * @param item The item for which to generate an ID.
 * @returns A unique identifier string.
 */
export function generateUniqueId(item: PipelineItem): string {
  let id = item.guid || item.link || item.id || item.applicationLink;
  if (!id) {
    throw new Error('Could not generate a unique ID for the item: missing guid, link, id, or applicationLink.');
  }
  // Sanitize the ID to remove characters invalid for Firestore document paths
  // Firestore document IDs cannot contain '/', so replace with a safe character.
  // Also, remove any leading or trailing slashes that might result from the original URL or replacement.
  id = id.replace(/\//g, '-').replace(/^-+|-+$/g, '');
  return id;
}