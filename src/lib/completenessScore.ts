
import { Article, JobPosting } from './types.js';

// This is a simplified version of the Zod-inferred types from the script
// We use the main types and handle potential nulls.
type ArticleForScore = Partial<Article>;
type JobForScore = Partial<JobPosting>;


export const calculateArticleCompleteness = (article: ArticleForScore): number => {
  let score = 0;
  if (article.excerpt) score += 2;
  if (article.imageUrl) score += 1;
  if (article.tags && article.tags.length > 0) score += 1;
  if (article.contentBody && article.contentBody.length > 1000) score += 3;
  if (article.sourceName && article.originalUrl) score += 1;
  return score;
};

export const calculateJobCompleteness = (job: JobForScore): number => {
  let score = 0;
  if (job.title) score += 1;
  if (job.company) score += 1;
  if (job.companyLogoUrl) score += 1;
  if (job.description) {
    const lowerDesc = job.description.toLowerCase();
    if (lowerDesc.includes('responsibilities')) score += 1;
    if (lowerDesc.includes('qualifications')) score += 1;
    if (lowerDesc.length > 500) score += 1;
  }
  if (job.location) score += 1;
  if (job.salaryRange) score += 2;
  if (job.jobLevel) score += 1;
  if (job.tags && job.tags.length > 2) score += 1;
  if (job.applicationLink) score += 1;
  return score;
};
