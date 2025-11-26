import { StandardJob, StandardBriefing } from '../types.js';
import logger from './logger.js';

const MIN_JOB_DESCRIPTION_LENGTH = 200;
const MIN_BRIEFING_CONTENT_LENGTH = 300; // Briefings should be more substantial
const FORBIDDEN_COMPANY_NAMES = ['confidential', 'stealth'];

/**
 * Checks if a job posting meets our defined quality standards using a scoring system.
 * @param job The standardized job object.
 * @returns True if the job is high quality, false otherwise.
 */
export function isJobHighQuality(job: StandardJob, minScore?: number): boolean {
    const requiredScore = minScore ?? 2;
    let score = 0;
    const checks = [];

    // Rule 1: Must have a salary
    if (job.hasSalary) {
        score++;
        checks.push('hasSalary');
    }

    // Rule 2: Must have a substantial description
    if (job.description && job.description.length > MIN_JOB_DESCRIPTION_LENGTH) {
        score++;
        checks.push('hasLongDescription');
    }

    // Rule 3: Must have a non-generic company name
    if (job.company && !FORBIDDEN_COMPANY_NAMES.includes(job.company.toLowerCase())) {
        score++;
        checks.push('hasGoodCompany');
    }

    const passed = score >= requiredScore;

    if (!passed) {
        logger.debug({ 
            jobId: job.id, 
            source: job.source, 
            score: score, 
            checksPassed: checks 
        }, '[QualityFilter] Job failed quality check.');
    }

    return passed;
}

/**
 * Checks if a briefing meets our defined quality standards using a scoring system.
 * @param briefing The standardized briefing object.
 * @returns True if the briefing is high quality, false otherwise.
 */
export function isBriefingHighQuality(briefing: StandardBriefing, minScore?: number): boolean {
    const requiredScore = minScore ?? 3;
    let score = 0;
    const checks = [];

    // Rule 1: Must have substantial content
    if (briefing.content && briefing.content.length > MIN_BRIEFING_CONTENT_LENGTH) {
        score++;
        checks.push('hasLongContent');
    }

    // Rule 2: Must have tags/categories
    if (briefing.tags && briefing.tags.length > 0) {
        score++;
        checks.push('hasTags');
    }

    // Rule 3: Must have a specific author (not just the source name)
    if (briefing.author && briefing.author !== briefing.sourceName) {
        score++;
        checks.push('hasSpecificAuthor');
    }

    // Rule 4: Must be recent (newer than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (briefing.publishDate > sevenDaysAgo) {
        score++;
        checks.push('isRecent');
    }

    const passed = score >= requiredScore;

    if (!passed) {
        logger.debug({ 
            briefingId: briefing.id, 
            source: briefing.sourceName, 
            score: score, 
            checksPassed: checks 
        }, '[QualityFilter] Briefing failed quality check.');
    }

    return passed;
}
