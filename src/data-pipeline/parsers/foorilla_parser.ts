import * as cheerio from 'cheerio';
import { IParser, ParsedJobDetails } from './base_parser';

export class FoorillaParser implements IParser {
    parse(html: string): ParsedJobDetails {
        const $ = cheerio.load(html);

        const responsibilities: string[] = [];
        const qualifications: string[] = [];

        // Find the 'Tasks' section and parse its list items
        $('strong:contains("Tasks:")').next('ul').find('li').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text) responsibilities.push(text.replace(/^\*\s*/, '')); // Remove leading asterisks
        });

        // Find the 'Skills/Tech-stack' section and parse its content
        const skillsText = $('strong:contains("Skills/Tech-stack required:")').next('div').text().trim();
        if (skillsText) {
            const skills = skillsText.replace(/[\[\]]/g, ' ').split('][').map(skill => skill.trim()).filter(skill => skill);
            qualifications.push(...skills);
        }

        // For now, we return an empty description as it's handled by the structured fields.
        const result: ParsedJobDetails = {
            description: '', // Or a summary if we decide to generate one
            responsibilities,
            qualifications,
        };

        return result;
    }
}
