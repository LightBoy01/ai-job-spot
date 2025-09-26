import * as cheerio from 'cheerio';
import { IParser } from './base_parser';

// This interface defines all the fields that can be extracted from the detail page HTML.
export interface ParsedJobDetails {
  title: string;
  company: string;
  location: string;
  jobLevel?: string;
  employeeRole?: string;
  salaryRange?: string;
  responsibilities: string[];
  qualifications: string[];
  description: string; // The introductory paragraph
}

export class FoorillaParser implements IParser {
  parse(data: unknown): ParsedJobDetails {
    if (typeof data !== 'string') {
      throw new Error('FoorillaParser expects a string of HTML data.');
    }
    const $ = cheerio.load(data);

    // --- Basic Info ---
    const title = $('h1').first().text().trim();
    const company = $('div.hstack strong a').first().text().trim();

    // --- Location and Metadata Block ---
    const locationTextBlock = $('div.hstack > div:first-child').text().trim();
    const location = locationTextBlock.split('\n')[0].trim();

    const bracketedTerms = locationTextBlock.match(/[\[\]]/g) || [];
    const jobLevelKeywords = [
      'entry',
      'mid-level',
      'senior',
      'lead',
      'principal',
      'intermediate',
    ];
    const roleKeywords = ['full time', 'part time', 'contract', 'internship'];
    let jobLevel: string | undefined;
    let employeeRole: string | undefined;

    bracketedTerms.forEach((term) => {
      const termLower = term.toLowerCase();
      if (jobLevelKeywords.some((k) => termLower.includes(k)))
        jobLevel = term.replace(/[[\]]/g, '');
      if (roleKeywords.some((k) => termLower.includes(k)))
        employeeRole = term.replace(/[[\]]/g, '');
    });

    const salaryMatch = locationTextBlock.match(
      /(USD|CAD|MXN) [0-9,K]+(-[0-9,K]+)?/
    );
    const salaryRange = salaryMatch ? salaryMatch[0] : undefined;

    // --- Responsibilities and Qualifications ---
    const responsibilities: string[] = [];
    $('strong:contains("Tasks:")')
      .next('ul')
      .find('li')
      .each((i, elem) => {
        const text = $(elem).text().trim();
        if (text && text.toLowerCase() !== 'n/a')
          responsibilities.push(text.replace(/^\*\s*/, ''));
      });

    const qualifications: string[] = [];
    const skillsText = $('strong:contains("Skills/Tech-stack required:")')
      .next('div')
      .text()
      .trim();
    if (skillsText) {
      const skills = skillsText
        .replace(/[[\]]/g, ' ')
        .split('][')
        .map((skill) => skill.trim())
        .filter((skill) => skill);
      qualifications.push(...skills);
    }

    // --- Description ---
    // This is tricky. We assume the description is any text before the 'Tasks' or 'Skills' sections.
    // For now, we will leave this blank as the structured data is more important.
    const description = '';

    return {
      title,
      company,
      location,
      jobLevel,
      employeeRole,
      salaryRange,
      responsibilities,
      qualifications,
      description,
    };
  }
}
