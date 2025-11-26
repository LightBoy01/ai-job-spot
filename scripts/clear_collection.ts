import { getFirebaseAdmin } from '../src/lib/firebaseAdmin.js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const BATCH_SIZE = 100;

// --- Safety Guardrails ---

/**
 * Reads the .firebaserc file to determine the target project.
 */
function getTargetProject(): string | null {
  try {
    const rcPath = path.resolve(process.cwd(), '.firebaserc');
    const rcFile = fs.readFileSync(rcPath, 'utf8');
    const rcData = JSON.parse(rcFile);
    // Assuming 'default' is the production project, a common convention.
    // Add any other production aliases here.
    return rcData.projects?.default || null;
  } catch (error) {
    console.warn('Could not read .firebaserc file. Proceeding with caution.');
    return null;
  }
}

/**
 * Creates a readline interface for user prompts.
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts the user with a question and returns their answer.
 */
function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

// --- Core Logic ---

async function clearCollection(collectionPath: string, count: number = 0): Promise<number> {
  const { adminDb } = await getFirebaseAdmin();
  const collectionRef = adminDb.collection(collectionPath);
  const snapshot = await collectionRef.limit(BATCH_SIZE).get();

  if (snapshot.empty) {
    return count;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  const newCount = count + snapshot.size;
  process.stdout.write(`Deleted ${newCount} documents...\r`);

  // Recurse if there are more documents
  if (snapshot.size === BATCH_SIZE) {
    return clearCollection(collectionPath, newCount);
  }

  return newCount;
}

async function main() {
  const args = process.argv.slice(2);
  const collectionName = args.find((arg) => !arg.startsWith('--'));
  const forceProd = args.includes('--force-prod');

  if (!collectionName) {
    console.error('Usage: ts-node scripts/clear_collection.ts <collectionName> [--force-prod]');
    process.exit(1);
  }

  const targetProject = getTargetProject();
  const isProduction = targetProject === 'ai-jobs-spot'; // Your production project ID

  console.log(`Target project detected: ${targetProject || 'unknown'}`);

  if (isProduction && !forceProd) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Target is a production project.');
    console.error('This is a destructive operation. To run against production, you must include the --force-prod flag.');
    console.error('Example: ts-node scripts/clear_collection.ts my_collection --force-prod');
    process.exit(1);
  }

  if (isProduction && forceProd) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: --force-prod flag detected. You are about to modify a production database.');
    const confirmation = await askQuestion(`To confirm, please type the name of the project you are targeting ('${targetProject}'): `);
    if (confirmation !== targetProject) {
      console.log('Confirmation failed. Aborting.');
      process.exit(0);
    }
    console.log('Confirmation successful. Proceeding with deletion...');
  }

  try {
    console.log(`Starting deletion for collection: '${collectionName}'...`);
    const totalDeleted = await clearCollection(collectionName);
    console.log(`\nFinished clearing collection: '${collectionName}'. Total documents deleted: ${totalDeleted}.`);
  } catch (error) {
    console.error(`\nAn error occurred:`, error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();