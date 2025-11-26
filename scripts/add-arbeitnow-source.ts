import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';
import logger from '../src/data-pipeline/utils/logger.js';

async function addArbeitnowSource() {
  logger.info('Adding Arbeitnow source to Firestore...');
  const { adminDb } = await getFirebaseAdmin();

  const arbeitnowSource = {
    id: 'arbeitnow',
    sourceName: 'Arbeitnow',
    type: 'Job',
    adapter: 'Arbeitnow',
    status: 'Active',
    baseUrl: 'https://arbeitnow.com/api/job-board-api',
    keywords: ['AI', 'Machine Learning', 'Deep Learning'],
    remote: true,
    visa_sponsorship: false,
    maxPages: 5, // Fetch up to 5 pages
    fetchFrequency: 'daily',
    enabled: true,
    notes: 'Arbeitnow API for AI-related jobs.',
  };

  try {
    await adminDb.collection('sources').doc(arbeitnowSource.id).set(arbeitnowSource, { merge: true });
    logger.info('Arbeitnow source added to Firestore successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Failed to add Arbeitnow source to Firestore.');
    process.exit(1);
  }
}

addArbeitnowSource();
