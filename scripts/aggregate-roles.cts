const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { getFirebaseAdmin, admin } = require('../src/lib/firebaseAdmin');

const METADATA_COLLECTION = 'metadata';
const COMMON_ROLES_DOC = 'common_roles';

/**
 * Aggregates job titles from the 'jobs' collection and saves the top
 * roles to a document in the 'metadata' collection.
 */
async function aggregateCommonRoles() {
  console.log('Starting common roles aggregation script...');

  const { adminDb } = await getFirebaseAdmin();
  const jobsCollection = adminDb.collection('jobs');
  const metadataDocRef = adminDb.collection(METADATA_COLLECTION).doc(COMMON_ROLES_DOC);

  // 1. Fetch all job titles
  console.log("Fetching all job titles from Firestore...");
  const snapshot = await jobsCollection.where('status', '==', 'published').select('title').get();
  
  if (snapshot.empty) {
    console.log('No published jobs found. Nothing to aggregate.');
    return;
  }

  // 2. Aggregate titles
  const titleCounts = new Map();
  snapshot.docs.forEach((doc) => {
    const job = doc.data();
    const title = job.title?.trim();
    if (title) {
        // Basic normalization
        const normalizedTitle = title
            .toLowerCase()
            .replace(/\(.*\)|\[.*\]/g, '') // Remove anything in parentheses/brackets
            .replace(/senior|lead|sr\.|principal/g, '') // Remove seniority
            .replace(/ai\/ml|ml\/ai/g, 'ai / ml') // Normalize slashes
            .replace(/engineer|developer/g, 'engineer') // Normalize roles
            .replace(/data scientist|scientist/g, 'data scientist')
            .trim();
        
      titleCounts.set(normalizedTitle, (titleCounts.get(normalizedTitle) || 0) + 1);
    }
  });

  // 3. Get the top N roles
  const topRoles = Array.from(titleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // Get top 15
    .map(([title, count]) => {
        // Create a user-friendly title and a machine-friendly key
        const prettyTitle = title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const key = title.replace(/\s+/g, '_');
        return { key, title: prettyTitle, count };
    });

  if (topRoles.length === 0) {
      console.log("No roles to save after aggregation.");
      return;
  }

  // 4. Save to metadata document
  console.log(`Found ${topRoles.length} common roles to save.`);
  console.log(topRoles);
  
  const dataToSave = {
      roles: topRoles,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  await metadataDocRef.set(dataToSave, { merge: true });

  console.log(`Successfully saved common roles to '${METADATA_COLLECTION}/${COMMON_ROLES_DOC}'.`);
}

module.exports = { aggregateCommonRoles };

