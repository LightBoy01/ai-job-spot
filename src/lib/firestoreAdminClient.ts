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

export async function getSalaryStats(title: string): Promise<{ min: number; max: number; avg: number; count: number; currency: string } | null> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    // Simple normalization: "Senior Machine Learning Engineer" -> "Machine Learning Engineer"
    // This helps broaden the search for better stats.
    const normalizedTitle = title.replace(/Senior |Junior |Lead |Principal |Staff /i, '').trim();

    const jobsRef = adminDb.collection('jobs');
    const q = jobsRef
      .where('status', '==', 'published')
      .where('title', '>=', normalizedTitle)
      .where('title', '<=', normalizedTitle + '\uf8ff')
      .orderBy('title')
      .orderBy('postedDate', 'desc')
      .limit(50); // Limit sample size for performance

    const snapshot = await q.get();
    
    if (snapshot.empty) {
      return null;
    }

    const salaries: number[] = [];
    let currency = 'USD';

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.salaryRange) {
        // Extract numbers. Matches "$150,000 - $200,000" or "150k"
        const numbers = data.salaryRange.match(/\d+/g)?.map(Number);
        if (numbers && numbers.length > 0) {
           // Heuristic: If it's small (e.g. 150), assume 'k' (150,000)
           const val = numbers[0] < 1000 ? numbers[0] * 1000 : numbers[0];
           // Simple validation to exclude outliers (e.g. hourly rates like $50)
           if (val > 10000) { 
             salaries.push(val);
           }
        }
      }
    });

    if (salaries.length === 0) {
      return null;
    }

    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);

    return { min, max, avg, count: salaries.length, currency };

  } catch (error) {
    console.error('Error calculating salary stats:', error);
    return null;
  }
}

export async function getRelatedSkills(tags: string[], limit = 10): Promise<{ type: 'skill' | 'location'; value: string }[]> {
  if (!tags || tags.length === 0) return [];

  try {
    const { adminDb } = await getFirebaseAdmin();
    // Query jobs that have at least one of the matching tags
    // Firestore 'array-contains-any' is limited to 10 values
    const searchTags = tags.slice(0, 10);
    
    const jobsRef = adminDb.collection('jobs');
    const q = jobsRef
      .where('status', '==', 'published')
      .where('tags', 'array-contains-any', searchTags)
      .orderBy('postedDate', 'desc')
      .limit(20); // Analyze 20 similar jobs

    const snapshot = await q.get();
    
    if (snapshot.empty) return [];

    const tagFrequency: Record<string, number> = {};
    const inputTagsSet = new Set(tags.map(t => t.toLowerCase()));

    snapshot.docs.forEach(doc => {
      const jobTags = doc.data().tags || [];
      jobTags.forEach((tag: string) => {
        const lowerTag = tag.toLowerCase();
        // Exclude the tags we already searched for (to show *related* skills, not same skills)
        if (!inputTagsSet.has(lowerTag)) {
           tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    const sortedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => ({ type: 'skill' as const, value: tag }));

    return sortedTags;

  } catch (error) {
    console.error('Error fetching related skills:', error);
    return [];
  }
}

export async function getTopMetadata(): Promise<{ tags: string[]; locations: string[] }> {
  try {
    const { adminDb } = await getFirebaseAdmin();
    // Fetch last 100 jobs to analyze trends
    const snapshot = await adminDb.collection('jobs')
      .where('status', '==', 'published')
      .orderBy('postedDate', 'desc')
      .limit(100)
      .get();

    const tagCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Count Tags
      if (Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }

      // Count Locations (simple string frequency)
      if (data.location && typeof data.location === 'string') {
        const loc = data.location.trim();
        // Maybe simplify locations here if needed (e.g. "Berlin, Germany" -> "Berlin")
        // For now, use raw string but trim
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag]) => tag);

    const sortedLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([loc]) => loc);

    return { tags: sortedTags, locations: sortedLocations };

  } catch (error) {
    console.error('Error fetching top metadata:', error);
    return { tags: [], locations: [] };
  }
}