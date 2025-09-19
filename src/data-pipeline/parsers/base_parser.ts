import { JobItem } from '../main';

// Defines the output structure that all parsers must return.
export interface ParsedJobDetails {
    description?: string;
    responsibilities: string[];
    qualifications: string[];
}

// Defines the interface that every site-specific parser must implement.
export interface IParser {
    parse(html: string): ParsedJobDetails;
}
