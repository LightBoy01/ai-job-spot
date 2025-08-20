
export interface JobPosting {
  id?: string; // Optional, as Firestore generates this
  title: string;
  company: string;
  description: string; // This can be a full HTML description or a summary
  responsibilities?: string[]; // A list of key responsibilities
  qualifications?: string[]; // A list of required qualifications
  preferredQualifications?: string[]; // Optional list of preferred qualifications
  location: string;
  salaryRange?: string; // Optional
  postedDate: Date;
  expirationDate?: Date; // Optional expiration date for job postings
  applicationLink: string;
  tags: string[]; // e.g., ['AI', 'Machine Learning', 'Remote']
  jobLevel?: string; // e.g., P40
  employeeRole?: string; // e.g., Individual Contributor
  status?: 'draft' | 'pending_review' | 'published' | 'rejected'; // Workflow status
  isNew?: boolean;
}

export interface Article {
  id?: string;
  title: string;
  author: string;
  publishDate: Date;
  contentBody: string;
  tags: string[];
  slug: string;
  issueNo?: number;
  volumeNo?: number;
  imageUrl?: string | null;
}

// For server-side rendering, where Timestamps are serialized
export interface SerializedJobPosting extends Omit<JobPosting, 'postedDate' | 'expirationDate'> {
  postedDate: string;
  expirationDate: string | null;
  isNew?: boolean;
}

export interface SerializedArticle extends Omit<Article, 'publishDate'> {
  publishDate: string | null;
}
