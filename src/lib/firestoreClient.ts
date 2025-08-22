import { collection, getDocs, query, orderBy, where, doc, getDoc, DocumentSnapshot, DocumentData, Timestamp, limit as limitTo, startAfter } from 'firebase/firestore';
import { db } from './firebase'; // Import the client-side db instance
import { JobPosting, Article } from './types';

// Helper function to convert Firestore Timestamp to JavaScript Date
const convertTimestampToDate = (timestamp: Timestamp | undefined): Date | undefined => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return undefined;
};

// Helper function to process job data
const processJobData = (docSnap: DocumentSnapshot<DocumentData>): JobPosting => {
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
    } as JobPosting;
};

// Helper function to process article data
const processArticleData = (docSnap: DocumentSnapshot<DocumentData>): Article => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        title: data?.title || '',
        author: data?.author || '',
        publishDate: convertTimestampToDate(data?.publishDate) || new Date(),
        contentBody: data?.contentBody || '',
        tags: data?.tags || [],
        slug: data?.slug || '',
        issueNo: data?.issueNo,
        volumeNo: data?.volumeNo,
        imageUrl: data?.imageUrl || null,
    } as Article;
};

export async function getJobs(limit?: number, startAfterDoc?: DocumentSnapshot): Promise<{ jobs: JobPosting[], lastVisible: DocumentSnapshot | null }> {
  const jobsCollectionRef = collection(db, 'jobs');
  let q = query(jobsCollectionRef, where('status', '==', 'published'), orderBy('postedDate', 'desc'));

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const jobs = querySnapshot.docs.map(processJobData);
  const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

  return { jobs, lastVisible };
}

export async function getPendingJobs(): Promise<JobPosting[]> {
  const jobsCollectionRef = collection(db, 'jobs');
  const q = query(jobsCollectionRef, where('status', '==', 'pending_review'), orderBy('postedDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(processJobData);
}

export async function getArticles(limit?: number, startAfterDoc?: DocumentSnapshot): Promise<{ articles: Article[], lastVisible: DocumentSnapshot | null }> {
  const articlesCollectionRef = collection(db, 'articles');
  let q = query(articlesCollectionRef, orderBy('publishDate', 'desc'));

  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  if (limit) {
    q = query(q, limitTo(limit));
  }

  const querySnapshot = await getDocs(q);
  const articles = querySnapshot.docs.map(processArticleData);
  const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

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
