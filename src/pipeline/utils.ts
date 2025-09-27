import { BaseItemSchema } from './schemas.js';
import { z } from 'zod';

type Item = z.infer<typeof BaseItemSchema>;

/**
 * Generates a unique and consistent ID for an item.
 * Strategy: Use the item's `guid` if available, otherwise fall back to the `link`.
 * @param item The item for which to generate an ID.
 * @returns A unique identifier string.
 */
export function generateUniqueId(item: Item): string {
  let id = item.guid || item.link;
  // Sanitize the ID to remove characters invalid for Firestore document paths
  // Firestore document IDs cannot contain '/', so replace with a safe character.
  // Also, remove any leading or trailing slashes that might result from the original URL or replacement.
  id = id.replace(/\//g, '-').replace(/^-+|-+$/g, '');
  return id;
}
