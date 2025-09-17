
import * as admin from 'firebase-admin';

export interface JobPosting {
  id?: string; // Optional, as Firestore generates this
  title: string;
  company: string;
  companyLogoUrl?: string | null; // The new field for the company logo
  description: string; // This can be a full HTML description or a summary
  responsibilities?: string[]; // A list of key responsibilities
  qualifications?: string[]; // A list of required qualifications
  preferredQualifications?: string[]; // Optional list of preferred qualifications
  location: string;
  salaryRange?: string; // Optional
  postedDate: Date;
  expirationDate?: Date; // Optional expiration date for job postings
  applicationLink: string;
  applicationExperience?: string; // e.g., "Redirects to Workday; 15-20 minute application"
  tags: string[]; // e.g., ['AI', 'Machine Learning', 'Remote']
  jobLevel?: string; // e.g., P40
  employeeRole?: string; // e.g., Individual Contributor
  status?: 'draft' | 'pending_review' | 'published' | 'rejected'; // Workflow status
  isNew?: boolean;
  source?: string; // Source of the job posting (e.g., scraped from a specific site)
  glassdoorLink?: string;
  crunchbaseLink?: string;

  // Human Context Q&A
  story_question1?: string;
  story_answer1?: string;
  story_question2?: string;
  story_answer2?: string;
  story_question3?: string;
  story_answer3?: string;
}

export type FirestoreJobPosting = Omit<JobPosting, 'postedDate' | 'expirationDate' | 'salaryRange' | 'jobLevel' | 'employeeRole'> & {
    postedDate: admin.firestore.Timestamp;
    expirationDate?: admin.firestore.Timestamp;
    salaryRange?: string | null;
    jobLevel?: string | null;
    employeeRole?: string | null;
};

export interface Article {
  id?: string;
  title: string;
  author: string;
  publishDate: Date | null;
  contentBody: string;
  excerpt: string;
  tags: string[];
  slug: string;
  issueNo?: number;
  volumeNo?: number;

  imageUrl?: string | null;
  markdownFile?: string; // Path to the markdown file, added for consistency

  // Behind the Article Q&A
  author_take_question1?: string;
  author_take_answer1?: string;
  author_take_question2?: string;
  author_take_answer2?: string;
}

export type FirestoreArticle = Omit<Article, 'publishDate'> & {
    publishDate: admin.firestore.Timestamp;
};

// For server-side rendering, where Timestamps are serialized
export interface SerializedJobPosting extends Omit<JobPosting, 'postedDate' | 'expirationDate'> {
  postedDate: string | null;
  expirationDate: string | null;
  isNew?: boolean;
}

export interface SerializedArticle extends Omit<Article, 'publishDate'> {
  publishDate: string | null;
  excerpt: string;
}

// A more lightweight type for the article cards, excluding the full content.
export type SerializedArticleSummary = Omit<SerializedArticle, 'contentBody' | 'author_take_question1' | 'author_take_answer1' | 'author_take_question2' | 'author_take_answer2'>;
