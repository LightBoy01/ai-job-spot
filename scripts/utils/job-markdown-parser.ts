import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Parses the markdown content of a job description into structured fields.
 * This logic is extracted from the original seedFirestore.ts script to ensure
 * consistent parsing across different scripts.
 * 
 * @param content The raw markdown content of the job description.
 * @returns A promise that resolves to an object containing the parsed fields.
 */
export async function parseJobMarkdownFromContent(content: string): Promise<Record<string, any>> {
    const finalData: Record<string, any> = {};
    const headingRegex = /\n###\s+(.+?)\n/g;

    // Find the index of the first heading to determine the end of the description
    const firstMatch = headingRegex.exec(content);
    const firstHeadingIndex = firstMatch ? firstMatch.index : content.length;

    const description = content.substring(0, firstHeadingIndex).trim();
    finalData.description = DOMPurify.sanitize(await marked(description));

    // Reset regex for iteration
    headingRegex.lastIndex = 0;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
        const sectionTitle = match[1].trim().toLowerCase();
        const sectionStartIndex = match.index + match[0].length;

        // Find the next heading to determine the end of the current section
        let sectionEndIndex = content.length;
        const nextMatch = headingRegex.exec(content);
        if (nextMatch) {
            sectionEndIndex = nextMatch.index;
        }

        // Important: Reset lastIndex for the next iteration of the outer loop
        headingRegex.lastIndex = sectionStartIndex;

        const sectionContent = content.substring(sectionStartIndex, sectionEndIndex);
        // This parser handles lists starting with '-' or '*'
        const sectionItems = sectionContent
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.startsWith('- ') || s.startsWith('* '))
            .map(s => s.substring(2).trim())
            .filter(Boolean);

        if (sectionTitle === 'responsibilities') {
            finalData.responsibilities = sectionItems;
        } else if (sectionTitle === 'qualifications') {
            finalData.qualifications = sectionItems;
        } else if (sectionTitle === 'preferred qualifications') {
            finalData.preferredQualifications = sectionItems;
        }
    }

    // Ensure arrays are present even if empty, to satisfy schemas
    if (!finalData.responsibilities) finalData.responsibilities = [];
    if (!finalData.qualifications) finalData.qualifications = [];
    if (!finalData.preferredQualifications) finalData.preferredQualifications = [];

    return finalData;
}
