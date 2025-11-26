
import { SerializedJobPosting } from './types.js';

export interface SalaryInsight {
  min: number;
  max: number;
  average: number;
  count: number;
}

/**
 * Parses a salary string (e.g., "$150,000 - $240,000", "120k") and returns a numeric value.
 * @param salaryStr The salary string to parse.
 * @returns A numeric salary value or null if parsing fails.
 */
const parseSalary = (salaryStr: string): number | null => {
  if (!salaryStr) return null;
  const cleanedStr = salaryStr.toLowerCase().replace(/[^\d.k\s-]/g, '');
  const kMultiplier = cleanedStr.includes('k') ? 1000 : 1;
  const numbers = cleanedStr.replace(/k/g, '').trim().split(/\s*-\s*/).map(parseFloat).filter(n => !isNaN(n));

  if (numbers.length === 0) return null;

  // If it's a range, return the average of the range. If single number, return that.
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return avg * kMultiplier;
};

/**
 * Calculates salary insights from a list of job postings.
 * @param jobs An array of SerializedJobPosting objects.
 * @returns A SalaryInsight object or null if no valid salary data is found.
 */
export const calculateSalaryInsights = (jobs: SerializedJobPosting[]): SalaryInsight | null => {
  const salaries = jobs
    .map(job => job.salaryRange ? parseSalary(job.salaryRange) : null)
    .filter((s): s is number => s !== null);

  if (salaries.length === 0) {
    return null;
  }

  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  const average = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
  const count = salaries.length;

  return {
    min,
    max,
    average,
    count,
  };
};

/**
 * Extracts and ranks related entities (skills, locations, etc.) from a list of job postings.
 * @param jobs An array of SerializedJobPosting objects.
 * @param currentDimension The dimension of the current page (e.g., 'skill').
 * @param currentValue The value of the current page (e.g., 'python').
 * @param limit The maximum number of related entities to return.
 * @returns An array of objects representing the most common related entities.
 */
export const getRelatedEntities = (
  jobs: SerializedJobPosting[],
  currentDimension?: string,
  currentValue?: string,
  limit = 10
): { type: 'skill' | 'location'; value: string }[] => {
  const skillFrequency = new Map<string, number>();
  const locationFrequency = new Map<string, number>();

  jobs.forEach(job => {
    job.tags.forEach((tag: string) => {
      const lowerCaseTag = tag.toLowerCase();
      if (currentDimension !== 'skill' || lowerCaseTag !== currentValue?.toLowerCase()) {
        skillFrequency.set(lowerCaseTag, (skillFrequency.get(lowerCaseTag) || 0) + 1);
      }
    });

    const lowerCaseLocation = job.location.toLowerCase();
    if (currentDimension !== 'location' || lowerCaseLocation !== currentValue?.toLowerCase()) {
      locationFrequency.set(lowerCaseLocation, (locationFrequency.get(lowerCaseLocation) || 0) + 1);
    }
  });

  const sortedSkills = Array.from(skillFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => ({ type: 'skill' as const, value: entry[0] }));

  const sortedLocations = Array.from(locationFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => ({ type: 'location' as const, value: entry[0] }));

  // In a more advanced implementation, we could interleave these results.
  // For now, we'll prioritize skills, then locations.
  const combined = [...sortedSkills, ...sortedLocations];
  
  return combined.slice(0, limit);
};
