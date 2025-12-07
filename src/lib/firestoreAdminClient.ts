// This file exports functions that are pre-configured for the SERVER-SIDE Firebase Admin SDK.
// They are intended for use in server-side code (e.g., getStaticProps, API routes) and should not be used in client components.

import { getFirebaseAdmin } from './firebaseAdmin';
import { JobPosting, Article } from './types';
import { admin } from './firebaseAdmin';

// Helper function to convert Firestore Timestamp to JavaScript Date
const convertTimestampToDate = (
  timestamp: admin.firestore.Timestamp | undefined
): Date | undefined => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return undefined;
};

// Helper function to convert Firestore Verification Event to JS Object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertVerificationEvent = (event: any): any | null => {
  if (!event || !event.date) return null;
  return {
    date: convertTimestampToDate(event.date)!,
    type: event.type,
    verifier: event.verifier ?? null,
    note: event.note ?? null,
  };
};

// Helper function to process job data from the Admin SDK
const processJobData = (
  docSnap: admin.firestore.DocumentSnapshot
): JobPosting => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data?.title || '',
    company: data?.company || '',
    description: data?.description || '',
    responsibilities: data?.responsibilities || [],
    qualifications: data?.qualifications || [],
    preferredQualifications: data?.preferredQualifications || [],
    location: data?.location || '',
    salaryRange: data?.salaryRange || null,
    postedDate: convertTimestampToDate(data?.postedDate) || null,
    expirationDate: convertTimestampToDate(data?.expirationDate),
    applicationLink: data?.applicationLink || '',
    tags: data?.tags || [],
    isNew: data?.isNew || false,
    jobLevel: data?.jobLevel || null,
    employeeRole: data?.employeeRole || null,
    status: data?.status || 'draft',
    companyLogoUrl: data?.companyLogoUrl || null,
    applicationExperience: data?.applicationExperience || null,
    glassdoorLink: data?.glassdoorLink || null,
    crunchbaseLink: data?.crunchbaseLink || null,
    source: data?.source || null,
    sourceUrl: data?.sourceUrl || null,
    verificationDate: convertTimestampToDate(data?.verificationDate),
    verificationHistory: data?.verificationHistory?.map(convertVerificationEvent).filter(Boolean) || [],
    story_question1: data?.story_question1 || null,
    story_answer1: data?.story_answer1 || null,
    story_question2: data?.story_question2 || null,
    story_answer2: data?.story_answer2 || null,
    story_question3: data?.story_question3 || null,
    story_answer3: data?.story_answer3 || null,
    companyCulture: data?.companyCulture || null,
    relatedArticleIds: data?.relatedArticleIds || [],
  } as JobPosting;
};

// Helper function to process article data from the Admin SDK
const processArticleData = (
  docSnap: admin.firestore.DocumentSnapshot
): Article => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data?.title || '',
    author: data?.author || '',
    publishDate: convertTimestampToDate(data?.publishDate) || null,
    contentBody: data?.contentBody || '',
    tags: data?.tags || [],
    slug: data?.slug || '',
    issueNo: data?.issueNo,
    volumeNo: data?.volumeNo,
    imageUrl: data?.imageUrl || null,
    author_take_question1: data?.author_take_question1 || null,
    author_take_answer1: data?.author_take_answer1 || null,
    author_take_question2: data?.author_take_question2 || null,
    author_take_answer2: data?.author_take_answer2 || null,
    contentType: data?.contentType || 'editorial',
    excerpt: data?.excerpt || '',
    sourceName: data?.sourceName || null,
    originalUrl: data?.originalUrl || null,
    hub: data?.hub || null,
    relatedJobIds: data?.relatedJobIds || [],
  } as Article;
};

export async function getJobs(
  limit?: number
): Promise<{ jobs: JobPosting[]; lastVisible: admin.firestore.DocumentSnapshot | null }> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      let q: admin.firestore.Query = adminDb.collection('jobs')
          .where('status', '==', 'published')
          .orderBy('postedDate', 'desc');

      if (limit) {
          q = q.limit(limit);
      }

      const querySnapshot = await q.get();
      const jobs = querySnapshot.docs.map(processJobData);
      const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      return { jobs, lastVisible };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { jobs: [], lastVisible: null };
    }
}


export async function getJobById(id: string): Promise<JobPosting | null> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const jobDocRef = adminDb.collection('jobs').doc(id);
    const jobDocSnap = await jobDocRef.get();

    if (!jobDocSnap.exists) {
      return null;
    }
    return processJobData(jobDocSnap);
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    return null;
  }
}

export async function getArticles(
  limit?: number
): Promise<{ articles: Article[]; lastVisible: admin.firestore.DocumentSnapshot | null }> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    let q: admin.firestore.Query = adminDb.collection('articles')
      .orderBy('volumeNo', 'desc')
      .orderBy('issueNo', 'desc');

    if (limit) {
      q = q.limit(limit);
    }

    const querySnapshot = await q.get();
    const articles = querySnapshot.docs.map(processArticleData);
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    return { articles, lastVisible };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], lastVisible: null };
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    const articlesCollectionRef = adminDb.collection('articles');
    const q = articlesCollectionRef.where('slug', '==', slug);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return null;
    }
    return processArticleData(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`Error fetching article ${slug}:`, error);
    return null;
  }
}

export async function getJobsByTag(
  tags: string[],
  limit?: number
): Promise<{ jobs: JobPosting[]; lastVisible: admin.firestore.DocumentSnapshot | null }> {
  if (!tags || tags.length === 0) {
    return { jobs: [], lastVisible: null };
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    let q: admin.firestore.Query = adminDb.collection('jobs')
      .where('status', '==', 'published')
      .where('tags', 'array-contains-any', tags)
      .orderBy('postedDate', 'desc');

    if (limit) {
      q = q.limit(limit);
    }

    const querySnapshot = await q.get();
    const jobs = querySnapshot.docs.map(processJobData);
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

    return { jobs, lastVisible };
  } catch (error) {
    console.error('Error fetching jobs by tag:', error);
    return { jobs: [], lastVisible: null };
  }
}

export async function getRelevantArticles(
  tags: string[],
  currentArticleId: string,
  limit = 3
): Promise<Article[]> {
  if (!tags || tags.length === 0) {
    return [];
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    const articlesCollectionRef = adminDb.collection('articles');
    const q = articlesCollectionRef
      .where('tags', 'array-contains-any', tags)
      .orderBy('publishDate', 'desc')
      .limit(limit + 1); // Fetch one more to see if we need to exclude the current article

    const querySnapshot = await q.get();
    const articles = querySnapshot.docs
      .map(processArticleData)
      .filter((article: Article) => article.id !== currentArticleId);

    return articles.slice(0, limit);
  } catch (error) {
    console.error('Error fetching relevant articles:', error);
    return [];
  }
}

export async function getArticlesByIds(ids: string[]): Promise<Article[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    // Firestore 'in' queries are limited to 10 items.
    // Since our MAX_RELATED is 3, this is safe.
    // If ids.length > 10, we'd need to batch this.
    const refs = ids.map(id => adminDb.collection('articles').where('slug', '==', id).limit(1));
    const snapshots = await Promise.all(refs.map(q => q.get()));
    
    const articles: Article[] = [];
    snapshots.forEach(snap => {
      if (!snap.empty) {
        articles.push(processArticleData(snap.docs[0]));
      }
    });

    return articles;
  } catch (error) {
    console.error('Error fetching articles by IDs:', error);
    return [];
  }
}

export async function getJobsByIds(ids: string[]): Promise<JobPosting[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  try {
    const { adminDb } = await getFirebaseAdmin();
    // Using getAll for direct document IDs is more efficient than queries
    const refs = ids.map(id => adminDb.collection('jobs').doc(id));
    const snapshots = await adminDb.getAll(...refs);
    
    return snapshots
      .filter(doc => doc.exists)
      .map(processJobData);

  } catch (error) {
    console.error('Error fetching jobs by IDs:', error);
    return [];
  }
}