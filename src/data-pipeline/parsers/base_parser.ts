import { JobItem } from '../main.js';

// Defines the output structure that all parsers must return.
export interface ParsedJobDetails {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    responsibilities: string[];
    qualifications: string[];
    jobLevel?: string;
    employeeRole?: string;
    salaryRange?: string;
}

// Defines the interface that every site-specific parser must implement.
export interface IParser {
    parse(html: string): ParsedJobDetails;
}
