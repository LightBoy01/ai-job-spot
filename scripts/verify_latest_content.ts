import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.ts';

async function verifyContent() {
  console.log('Fetching latest aggregated content from Firestore...');
  const { adminDb } = await getFirebaseAdmin();

  // Fetch the most recent job
  const jobsRef = adminDb.collection('jobs');
  const latestJobSnapshot = await jobsRef.orderBy('postedDate', 'desc').limit(1).get();
  if (latestJobSnapshot.empty) {
    console.log('No jobs found.');
  } else {
    console.log('\n--- LATEST JOB ---');
    console.log(JSON.stringify(latestJobSnapshot.docs[0].data(), null, 2));
  }

  // Fetch the most recent article
  const articlesRef = adminDb.collection('aggregatedArticles');
  const latestArticleSnapshot = await articlesRef.orderBy('publishDate', 'desc').limit(1).get();
  if (latestArticleSnapshot.empty) {
    console.log('No articles found.');
  } else {
    console.log('\n--- LATEST ARTICLE ---');
    console.log(JSON.stringify(latestArticleSnapshot.docs[0].data(), null, 2));
  }
}

verifyContent().catch(console.error).finally(() => process.exit());
