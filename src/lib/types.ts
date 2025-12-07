import admin from 'firebase-admin';

export interface JobPosting {
  id?: string; // Optional, as Firestore generates this
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  description: string; // This can be a full HTML description or a summary
  responsibilities?: string[]; // A list of key responsibilities
  qualifications?: string[]; // A list of required qualifications
  preferredQualifications?: string[]; // Optional list of preferred qualifications
  location: string;
  salaryRange?: string | null;
  postedDate: Date;
  expirationDate?: Date | null; // Optional expiration date for job postings
  applicationLink: string;
  applicationExperience?: string | null;
  tags: string[]; // e.g., ['AI', 'Machine Learning', 'Remote']
  jobLevel?: string | null;
  employeeRole?: string | null;
  status?: 'draft' | 'pending_review' | 'pending_approval' | 'published' | 'rejected'; // Workflow status
  isNew?: boolean;
  isFeatured?: boolean;
  source?: string | null;
  sourceUrl?: string | null;
  glassdoorLink?: string | null;
  crunchbaseLink?: string | null;

  story_question1?: string | null;
  story_answer1?: string | null;
  story_question2?: string | null;
  story_answer2?: string | null;
  story_question3?: string | null;
  story_answer3?: string | null;
  companyCulture?: string | null;
  verificationDate?: Date | null;
  verificationHistory?: VerificationEvent[] | null;
  relatedArticleIds?: string[];
}

export interface VerificationEvent {
  date: Date;
  type: 'automated' | 'manual' | 'crowdsourced';
  verifier?: string; // e.g., "admin-bot", "user-report"
  note?: string;
}

export type FirestoreJobPosting = Omit<
  JobPosting,
  | 'postedDate'
  | 'expirationDate'
  | 'salaryRange'
  | 'jobLevel'
  | 'employeeRole'
  | 'verificationDate'
  | 'verificationHistory'
> & {
  postedDate: admin.firestore.Timestamp;
  expirationDate?: admin.firestore.Timestamp | null;
  salaryRange?: string | null;
  jobLevel?: string | null;
  employeeRole?: string | null;
  verificationDate?: admin.firestore.Timestamp | null;
  verificationHistory?: FirestoreVerificationEvent[] | null;
};

export interface FirestoreVerificationEvent {
  date: admin.firestore.Timestamp;
  type: 'automated' | 'manual' | 'crowdsourced';
  verifier?: string;
  note?: string;
}

export interface Article {
  id?: string;
  title: string;
  author: string;
  publishDate: Date;
  contentBody: string | null;
  excerpt: string | null;
  tags: string[];
  slug: string;
  contentType: 'editorial' | 'briefing';
  sourceName?: string | null;
  originalUrl?: string | null;
  issueNo: number;
  volumeNo: number;
  hub?: string | null;
  imageUrl?: string | null;

  // Optional fields for author Q&A
  author_take_question1?: string | null;
  author_take_answer1?: string | null;
  author_take_question2?: string | null;
  author_take_answer2?: string | null;
  relatedJobIds?: string[];
}

export type FirestoreArticle = Omit<Article, 'publishDate'> & {
  publishDate: admin.firestore.Timestamp;
  author_take_question1?: string | null;
  author_take_answer1?: string | null;
  author_take_question2?: string | null;
  author_take_answer2?: string | null;
};

export interface SerializedVerificationEvent {
  date: string;
  type: 'automated' | 'manual' | 'crowdsourced';
  verifier?: string | null;
  note?: string | null;
}

// For server-side rendering, where Timestamps are serialized
export interface SerializedJobPosting
  extends Omit<
    JobPosting,
    'postedDate' | 'expirationDate' | 'verificationDate' | 'verificationHistory'
  > {
  postedDate: string | null;
  expirationDate: string | null;
  verificationDate?: string | null;
  verificationHistory?: SerializedVerificationEvent[] | null;
  isNew?: boolean;
  isFeatured?: boolean; // Added isFeatured
  story_question1?: string | null;
  story_answer1?: string | null;
  story_question2?: string | null;
  story_answer2?: string | null;
  story_question3?: string | null;
  story_answer3?: string | null;
  glassdoorLink?: string | null;
  crunchbaseLink?: string | null;
  companyCulture?: string | null;
}

// A more lightweight type for the job cards, excluding the full description.
export type SerializedJobSummary = Omit<
  SerializedJobPosting,
  |'description'
  | 'responsibilities'
  | 'qualifications'
  | 'preferredQualifications'
  | 'applicationExperience'
  | 'story_question1'
  | 'story_answer1'
  | 'story_question2'
  | 'story_answer2'
  | 'story_question3'
  | 'story_answer3'
  | 'companyCulture'
>;

export interface SerializedArticle extends Omit<Article, 'publishDate'> {
  publishDate: string | null;
  excerpt: string | null;
}

// A more lightweight type for the article cards, excluding the full content.
export type SerializedArticleSummary = Omit<
  SerializedArticle,
  | 'contentBody'
  | 'author_take_question1'
  | 'author_take_answer1'
  | 'author_take_question2'
  | 'author_take_answer2'
>;

export interface AggregatedArticle {
  id?: string;
  title: string;
  link: string;
  source: string;
  publishDate: Date | null;
  excerpt?: string;
  status?: 'pending' | 'published' | 'rejected'; // Added status field
}

export interface SerializedAggregatedArticle extends Omit<AggregatedArticle, 'publishDate'> {
  publishDate: string | null;
}

export interface Source {
  id?: string;
  sourceName: string;
  feedUrl: string;
  type: 'Job' | 'Article';
  adapter: 'RSS' | 'RSS_HUB' | 'HIRING_CAFE' | 'HIRING_CAFE_API';
  status: 'Pending' | 'Active' | 'Inactive';
  keywords?: string[];
  fetchFrequency?: 'daily' | 'weekly' | 'monthly';
  lastFetchedAt?: Date | null;
  notes?: string; // Add notes field
}

export interface SerializedSource extends Omit<Source, 'status' | 'type' | 'adapter' | 'keywords'> {
  status: string;
  type: string;
  adapter: string;
  keywords?: string;
  notes?: string; // Add notes field
}

export interface PipelineRunLog {
  runId: string;
  timestamp: Date;
  status: 'In Progress' | 'Success' | 'Partial Success' | 'Failure';
  feedsProcessed: number;
  itemsAdded: number;
  errors: Array<{ source: string; error: string }>;
}

export interface SerializedPipelineRunLog extends Omit<PipelineRunLog, 'timestamp'> {
  timestamp: string;
}
