import { firestore } from 'firebase-admin';

/**
 * Safely converts a date string or Date object from a client request 
 * into a Firestore Timestamp.
 * @param dateInput The date string or Date object from the request body.
 * @param fallback The fallback behavior: 'now' for server timestamp, or 'null' to return null.
 * @returns A Firestore Timestamp or null.
 */
export function safeToTimestamp(dateInput: string | Date | undefined | null, fallback: 'now' | 'null' = 'null'): firestore.Timestamp | null {
  if (!dateInput) {
    if (fallback === 'now') {
      return firestore.Timestamp.now();
    }
    return null;
  }

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      if (fallback === 'now') {
        return firestore.Timestamp.now();
      }
      return null;
    }
    return firestore.Timestamp.fromDate(date);
  } catch (error) {
    console.error('Error converting date to Timestamp:', error);
    return fallback === 'now' ? firestore.Timestamp.now() : null;
  }
}

/**
 * A simple, generic validation utility for API payloads.
 */

// The payload is passed to each rule for complex, cross-field validation.
type ValidationRule = (value: unknown, payload?: Record<string, unknown>) => string | null;

interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export function validatePayload(payload: Record<string, unknown>, schema: ValidationSchema): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const key in schema) {
    const rules = schema[key];
    const value = payload[key];

    for (const rule of rules) {
      // Pass both the specific field's value and the full payload to the rule.
      const errorMessage = rule(value, payload);
      if (errorMessage) {
        errors[key] = errorMessage;
        break; // Move to the next key after the first error for a field
      }
    }
  }

  return errors;
}

// --- Common Validation Rules ---

export const isRequired = (field: string): ValidationRule => 
  (value: unknown) => (value === null || value === undefined || value === '' || value === '<p><br></p>') ? `${field} is required.` : null;

export const isURL = (field: string): ValidationRule =>
  (value: unknown) => {
    if (!value || typeof value !== 'string') return null; // Not required, so skip if empty
    try {
      new URL(value);
      return null;
    } catch {
      return `Please enter a valid URL for ${field}.`;
    }
  };

export const isFutureDate = (field: string): ValidationRule =>
  (value: unknown) => {
    if (!value) return null;
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return `${field} is not a valid date.`;
    return date < new Date() ? `${field} must be in the future.` : null;
  };

export const isAfter = (otherField: string, otherFieldLabel: string): ValidationRule =>
    (value: unknown, payload?: Record<string, unknown>) => {
        if (!value || !payload || !payload[otherField]) return null;
        const date = new Date(value as string);
        const otherDate = new Date(payload[otherField] as string);
        if (isNaN(date.getTime()) || isNaN(otherDate.getTime())) return 'Invalid date format for comparison.';
        return date <= otherDate ? `Must be after ${otherFieldLabel}.` : null;
    };

export const slugify = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
  
    // remove accents, swap ñ for n, etc
    const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    const to   = "aaaaeeeeiiiioooouuuunc------";
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};
