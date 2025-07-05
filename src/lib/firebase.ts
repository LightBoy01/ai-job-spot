import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration from the Firebase console.
// We use process.env to keep your secrets safe and not commit them to git.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet.
// This prevents re-initialization errors in Next.js's hot-reloading environment.
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Get a reference to the Firestore database service
const db: Firestore = getFirestore(app);

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { JobPosting } from './types';

export { db };

export async function getJobs(): Promise<JobPosting[]> {
  const jobsCollectionRef = collection(db, 'jobs');
  const q = query(jobsCollectionRef, orderBy('postedDate', 'desc'));
  const querySnapshot = await getDocs(q);

  const jobs: JobPosting[] = [];
  querySnapshot.forEach((doc) => {
    jobs.push({
      id: doc.id,
      ...(doc.data() as JobPosting),
      postedDate: doc.data().postedDate.toDate(), // Convert Firestore Timestamp to Date object
    });
  });
  return jobs;
}
