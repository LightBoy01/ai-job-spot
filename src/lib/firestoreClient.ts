import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  DocumentSnapshot,
  DocumentData,
  Timestamp,
  limit as limitTo,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase'; // Import the client-side db instance
import { JobPosting, Article } from './types';

// Helper function to convert Firestore Timestamp to JavaScript Date
const convertTimestampToDate = (
  timestamp: Timestamp | undefined
): Date | undefined => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return undefined;
};

// Helper function to process job data
const processJobData = (
  docSnap: DocumentSnapshot<DocumentData>
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
    salaryRange: data?.salaryRange || '',
    postedDate: convertTimestampToDate(data?.postedDate) || new Date(),
    expirationDate: convertTimestampToDate(data?.expirationDate),
    applicationLink: data?.applicationLink || '',
    tags: data?.tags || [],
    isNew: data?.isNew || false,
    jobLevel: data?.jobLevel || '',
    employeeRole: data?.employeeRole || '',
    status: data?.status || 'draft',
    story_question1: data?.story_question1 || null,
    story_answer1: data?.story_answer1 || null,
    story_question2: data?.story_question2 || null,
    story_answer2: data?.story_answer2 || null,
    story_question3: data?.story_question3 || null,
    story_answer3: data?.story_answer3 || null,
    applicationExperience: data?.applicationExperience || null,
    glassdoorLink: data?.glassdoorLink || null,
    crunchbaseLink: data?.crunchbaseLink || null,
    companyCulture: data?.companyCulture || null,
  } as JobPosting;
};

// Helper function to process article data
const processArticleData = (
  docSnap: DocumentSnapshot<DocumentData>
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
  } as Article;
};

export async function getJobs(
  limit?: number,
  startAfterDoc?: DocumentSnapshot,
  searchTerm?: string
): Promise<{ jobs: JobPosting[]; lastVisible: DocumentSnapshot | null }> {
  const jobsCollectionRef = collection(db, 'jobs');
  let q;

  if (searchTerm && searchTerm.trim() !== '') {
    // For search, the primary order must be by the field used in the range filter.
    q = query(
      jobsCollectionRef,
      where('status', '==', 'published'),
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff'),
      orderBy('title', 'asc'),
      orderBy('postedDate', 'desc')
    );
  } else {
    // Default query without search - MUST have consistent ordering for pagination
    q = query(
      jobsCollectionRef,
      where('status', '==', 'published'),
      orderBy('postedDate', 'desc'),
      orderBy('title', 'asc') // Add secondary sort for consistency
    );
  }

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const jobs = querySnapshot.docs.map(processJobData);
  const lastVisible =
    querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

  return { jobs, lastVisible };
}

export async function getPendingJobs(): Promise<JobPosting[]> {
  const jobsCollectionRef = collection(db, 'jobs');
  const q = query(
    jobsCollectionRef,
    where('status', '==', 'pending_review'),
    orderBy('postedDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(processJobData);
}

export async function getArticles(
  limit?: number,
  startAfterDoc?: DocumentSnapshot,
  searchTerm?: string
): Promise<{ articles: Article[]; lastVisible: DocumentSnapshot | null }> {
  const articlesCollectionRef = collection(db, 'articles');
  let q;

  if (searchTerm && searchTerm.trim() !== '') {
    q = query(
      articlesCollectionRef,
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff'),
      orderBy('title', 'asc'),
      orderBy('publishDate', 'desc')
    );
  } else {
    q = query(
      articlesCollectionRef,
      orderBy('volumeNo', 'desc'),
      orderBy('issueNo', 'desc')
    );
  }

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const articles = querySnapshot.docs.map(processArticleData);
  const lastVisible =
    querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

  return { articles, lastVisible };
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articlesCollectionRef = collection(db, 'articles');
  const q = query(articlesCollectionRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }
  return processArticleData(querySnapshot.docs[0]);
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const jobDocRef = doc(db, 'jobs', id);
  const jobDocSnap = await getDoc(jobDocRef);

  if (!jobDocSnap.exists()) {
    return null;
  }
  return processJobData(jobDocSnap);
}

export async function getRelevantArticles(
  tags: string[],
  currentArticleId: string,
  limit = 3
): Promise<Article[]> {
  if (!tags || tags.length === 0) {
    return [];
  }

  const articlesCollectionRef = collection(db, 'articles');
  const q = query(
    articlesCollectionRef,
    where('tags', 'array-contains-any', tags),
    orderBy('publishDate', 'desc'),
    limitTo(limit + 1) // Fetch one more to see if we need to exclude the current article
  );

  const querySnapshot = await getDocs(q);
  const articles = querySnapshot.docs
    .map(processArticleData)
    .filter((article) => article.id !== currentArticleId);

  return articles.slice(0, limit);
}

export async function getJobsByTag(
  tags: string[],
  limit?: number,
  startAfterDoc?: DocumentSnapshot
): Promise<{ jobs: JobPosting[]; lastVisible: DocumentSnapshot | null }> {
  if (!tags || tags.length === 0) {
    return { jobs: [], lastVisible: null };
  }

  const jobsCollectionRef = collection(db, 'jobs');
  let q = query(
    jobsCollectionRef,
    where('status', '==', 'published'),
    where('tags', 'array-contains-any', tags),
    orderBy('postedDate', 'desc')
  );

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const jobs = querySnapshot.docs.map(processJobData);
  const lastVisible =
    querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

  return { jobs, lastVisible };
}

export async function getArticlesByTag(
  tags: string[],
  limit?: number,
  startAfterDoc?: DocumentSnapshot
): Promise<{ articles: Article[]; lastVisible: DocumentSnapshot | null }> {
  if (!tags || tags.length === 0) {
    return { articles: [], lastVisible: null };
  }

  const articlesCollectionRef = collection(db, 'articles');
  let q = query(
    articlesCollectionRef,
    where('tags', 'array-contains-any', tags),
    orderBy('publishDate', 'desc')
  );

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const articles = querySnapshot.docs.map(processArticleData);
  const lastVisible =
    querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

  return { articles, lastVisible };
}

export async function getAllTags(): Promise<string[]> {
  const jobsSnapshot = await getDocs(collection(db, 'jobs'));
  const articlesSnapshot = await getDocs(collection(db, 'articles'));

  const tags = new Set<string>();

  jobsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.tags) {
      data.tags.forEach((tag: string) => tags.add(tag));
    }
  });

  articlesSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.tags) {
      data.tags.forEach((tag: string) => tags.add(tag));
    }
  });

  return Array.from(tags);
}
