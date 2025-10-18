
/**
 * Sanitizes a string to be safe for use as a directory or file name.
 * It allows only alphanumeric characters, hyphens, and underscores, 
 * replacing all other characters with an underscore.
 * 
 * @param input The string to sanitize.
 * @returns A sanitized string safe for file system paths.
 */
export function sanitizeForFilePath(input: string): string {
    if (!input) {
        return 'unknown';
    }
    // Replace any character that is NOT a-z, A-Z, 0-9, -, or _ with an underscore.
    return input.replace(/[^a-zA-Z0-9_-]/g, '_');
}
