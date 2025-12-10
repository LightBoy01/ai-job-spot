import { getFirebaseAdmin } from './firebaseAdmin';
import { JobPosting, Article, SerializedJobPosting, SerializedArticleSummary } from './types';
import { Timestamp } from 'firebase-admin/firestore';

const convertTimestampToDate = (timestamp: Timestamp | undefined | null): Date | undefined => {
  if (!timestamp) return undefined;
  return timestamp.toDate();
};

const processJobData = (doc: FirebaseFirestore.DocumentSnapshot): JobPosting => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');
  
  return {
    id: doc.id,
    title: data.title || '',
    company: data.company || '',
    description: data.description || '',
    responsibilities: data.responsibilities || [],
    qualifications: data.qualifications || [],
    preferredQualifications: data.preferredQualifications || [],
    location: data.location || '',
    salaryRange: data.salaryRange || '',
    postedDate: convertTimestampToDate(data.postedDate) || new Date(),
    expirationDate: convertTimestampToDate(data.expirationDate),
    applicationLink: data.applicationLink || '',
    tags: data.tags || [],
    isNew: data.isNew || false,
    jobLevel: data.jobLevel || '',
    employeeRole: data.employeeRole || '',
    status: data.status || 'draft',
    story_question1: data.story_question1 || null,
    story_answer1: data.story_answer1 || null,
    story_question2: data.story_question2 || null,
    story_answer2: data.story_answer2 || null,
    story_question3: data.story_question3 || null,
    story_answer3: data.story_answer3 || null,
    applicationExperience: data.applicationExperience || null,
    glassdoorLink: data.glassdoorLink || null,
    crunchbaseLink: data.crunchbaseLink || null,
    companyCulture: data.companyCulture || null,
    companyLogoUrl: data.companyLogoUrl || null,
  } as JobPosting;
};

const processArticleData = (doc: FirebaseFirestore.DocumentSnapshot): Article => {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');

  return {
    id: doc.id,
    title: data.title || '',
    author: data.author || '',
    publishDate: convertTimestampToDate(data.publishDate) || new Date(),
    contentBody: data.contentBody || '',
    tags: data.tags || [],
    slug: data.slug || '',
    issueNo: data.issueNo,
    volumeNo: data.volumeNo,
    imageUrl: data.imageUrl || null,
    sourceName: data.sourceName || null,
    originalUrl: data.originalUrl || null,
    contentType: data.contentType || 'editorial',
    author_take_question1: data.author_take_question1 || null,
    author_take_answer1: data.author_take_answer1 || null,
    author_take_question2: data.author_take_question2 || null,
    author_take_answer2: data.author_take_answer2 || null,
    excerpt: data.excerpt || null,
  } as Article;
};

export async function getJobsServer(limitVal = 10) {
  const { adminDb } = await getFirebaseAdmin();
  const snapshot = await adminDb
    .collection('jobs')
    .where('status', '==', 'published')
    .orderBy('postedDate', 'desc')
    .orderBy('title', 'asc')
    .limit(limitVal)
    .get();

  const jobs = snapshot.docs.map(processJobData);
  
  const lastVisible =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { jobs, lastVisible };
}

export async function getArticlesServer(limitVal = 10) {
  const { adminDb } = await getFirebaseAdmin();
  const snapshot = await adminDb
    .collection('articles')
    .where('status', '==', 'published')
    .orderBy('publishDate', 'desc')
    .limit(limitVal)
    .get();

  const articles = snapshot.docs.map(processArticleData);
  
  const lastVisible =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { articles, lastVisible };
}
