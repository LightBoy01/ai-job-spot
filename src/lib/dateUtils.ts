import { Timestamp } from 'firebase/firestore';

/**
 * Formats an ISO date string into a more readable format (e.g., "July 29, 2025").
 * @param isoDate - The date string in ISO format.
 * @returns A formatted date string, or an empty string if the input is invalid.
 */
export const formatDate = (isoDate: string | null | undefined): string => {
  if (!isoDate) {
    return '';
  }
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Converts a Firestore Timestamp or a JavaScript Date to a JavaScript Date.
 * @param date - The date to convert, which can be a Timestamp or a Date.
 * @returns A Date object.
 */
export const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return date.toDate();
};
