import { Article, JobPosting } from './types';

// Helper to duck-type check for Timestamp
interface TimestampLike {
  toDate: () => Date;
}

const isTimestampLike = (value: unknown): value is TimestampLike => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as TimestampLike).toDate === 'function'
  );
};

export const convertTimestampToDate = (
  value: unknown
): Date | undefined => {
  if (value instanceof Date) return value;
  if (isTimestampLike(value)) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return undefined;
};

export const processJobData = (data: Record<string, unknown>, id: string): JobPosting => {
  return {
    applicationExperience: (data?.applicationExperience as string) || null,
    applicationLink: (data?.applicationLink as string) || '',
    company: (data?.company as string) || '',
    companyCulture: (data?.companyCulture as string) || null,
    companyLogoUrl: (data?.companyLogoUrl as string) || null,
    crunchbaseLink: (data?.crunchbaseLink as string) || null,
    description: (data?.description as string) || '',
    employeeRole: (data?.employeeRole as string) || '',
    expirationDate: convertTimestampToDate(data?.expirationDate),
    glassdoorLink: (data?.glassdoorLink as string) || null,
    id: id,
    isNew: (data?.isNew as boolean) || false,
    jobLevel: (data?.jobLevel as string) || '',
    location: (data?.location as string) || '',
    postedDate: convertTimestampToDate(data?.postedDate) || new Date(),
    preferredQualifications: (data?.preferredQualifications as string[]) || [],
    qualifications: (data?.qualifications as string[]) || [],
    responsibilities: (data?.responsibilities as string[]) || [],
    salaryRange: (data?.salaryRange as string) || '',
    status: (data?.status as "draft" | "pending_approval" | "pending_review" | "published" | "rejected") || 'draft',
    story_answer1: (data?.story_answer1 as string) || null,
    story_answer2: (data?.story_answer2 as string) || null,
    story_answer3: (data?.story_answer3 as string) || null,
    story_question1: (data?.story_question1 as string) || null,
    story_question2: (data?.story_question2 as string) || null,
    story_question3: (data?.story_question3 as string) || null,
    tags: (data?.tags as string[]) || [],
    title: (data?.title as string) || '',
    verificationDate: convertTimestampToDate(data?.verificationDate),
  };
};

export const processArticleData = (data: Record<string, unknown>, id: string): Article => {
  return {
    author: (data?.author as string) || '',
    author_take_answer1: (data?.author_take_answer1 as string) || null,
    author_take_answer2: (data?.author_take_answer2 as string) || null,
    author_take_question1: (data?.author_take_question1 as string) || null,
    author_take_question2: (data?.author_take_question2 as string) || null,
    contentBody: (data?.contentBody as string) || '',
    contentType: (data?.contentType as 'briefing' | 'editorial') || 'editorial',
    excerpt: (data?.excerpt as string) || '',
    hub: (data?.hub as string) || null,
    id: id,
    imageUrl: (data?.imageUrl as string) || null,
    issueNo: (data?.issueNo as number),
    originalUrl: (data?.originalUrl as string) || null,
    publishDate: convertTimestampToDate(data?.publishDate) || new Date(),
    slug: (data?.slug as string) || '',
    sourceName: (data?.sourceName as string) || null,
    tags: (data?.tags as string[]) || [],
    title: (data?.title as string) || '',
    volumeNo: (data?.volumeNo as number),
  };
};