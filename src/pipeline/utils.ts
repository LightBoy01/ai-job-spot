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
  if (item.guid) {
    return item.guid;
  }
  return item.link;
}
