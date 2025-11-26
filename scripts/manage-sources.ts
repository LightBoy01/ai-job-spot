
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import readline from 'readline';

interface Source {
  id: string;
  sourceName: string;
  [key: string]: any;
}


// --- Firebase Initialization ---
// Note: This assumes you have the FIREBASE_SERVICE_ACCOUNT_BASE64 env var set
const getDb = () => {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountEnv) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  }
  
  const serviceAccountJson = Buffer.from(serviceAccountEnv, 'base64').toString('utf-8').replace(/\n/g, '');
  const serviceAccount = JSON.parse(serviceAccountJson);

  initializeApp({
    credential: cert(serviceAccount),
  });

  return getFirestore();
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ALLOWED_TYPES = ['Job', 'Article'];
const ALLOWED_ADAPTERS = ['RSS', 'Playwright', 'HiringCafe', 'HIRING_CAFE', 'HIRING_CAFE_API', 'Arbeitnow'];

const question = (query: string, validator?: (input: string) => boolean | string): Promise<string> => {
    return new Promise((resolve) => {
        const ask = () => {
            rl.question(query, (answer) => {
                if (!validator) {
                    resolve(answer);
                    return;
                }
                const validationResult = validator(answer);
                if (validationResult === true) {
                    resolve(answer);
                } else {
                    console.error('Invalid input: ' + validationResult);
                    ask();
                }
            });
        };
        ask();
    });
}

const urlValidator = (input: string): boolean | string => {
    try {
        new URL(input);
        return true;
    } catch (error) {
        return 'Please enter a valid URL.';
    }
};

const enumValidator = (allowedValues: readonly string[]) => (input: string): boolean | string => {
    if (allowedValues.includes(input)) {
        return true;
    }
    return 'Value must be one of: ' + allowedValues.join(', ');
};

// --- Main Functions ---

async function listSources() {
  console.log('Fetching sources from Firestore...');
  const db = getDb();
  const sourcesSnapshot = await db.collection('sources').get();
  
  if (sourcesSnapshot.empty) {
    console.log('No sources found.');
    return;
  }

  const sources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Source[];
  
  console.log('Found ' + sources.length + ' sources:\n');
  sources.forEach(source => {
    console.log('----------------------------------------');
    console.log(JSON.stringify(source, null, 2));
    console.log('----------------------------------------\n');
  });
}

async function addSource() {
    console.log('--- Add a New Source (Interactive) ---');
    console.log('Please provide the following details:');

    const sourceName = await question('Source Name (must be unique, e.g., hiring.cafe): ');
    const type = await question('Type (' + ALLOWED_TYPES.join('/') + '): ', enumValidator(ALLOWED_TYPES));

    let minScore: number | null = null;
    if (type === 'Article') {
        const minScoreStr = await question('Minimum Quality Score (1-4, optional, default 3): ', (input) => {
            if (!input) return true;
            const score = parseInt(input, 10);
            return (!isNaN(score) && score >= 1 && score <= 4) || 'Please enter a number between 1 and 4.';
        });
        if (minScoreStr) {
            minScore = parseInt(minScoreStr, 10);
        }
    }

    const adapter = await question('Adapter (' + ALLOWED_ADAPTERS.join('/') + '): ', enumValidator(ALLOWED_ADAPTERS));

    let maxPages: number | null = null;
    if (adapter === 'Arbeitnow') {
        const maxPagesStr = await question('Max Pages to Fetch (optional, default 1): ', (input) => !input || !isNaN(parseInt(input, 10)) || 'Please enter a valid number.');
        if (maxPagesStr) {
            maxPages = parseInt(maxPagesStr, 10);
        }
    }

    const baseUrl = await question('Base URL: ', urlValidator);
    const feedUrl = await question('Feed URL (optional, for RSS): ', (input) => !input || urlValidator(input));
    const keywords = await question('Keywords (comma-separated, optional): ');
    const enabled = await question('Enable this source now? (yes/no): ', (input) => ['yes', 'no'].includes(input.toLowerCase()) || 'Please enter yes or no.') === 'yes';
    const remote = await question('Set remote only? (yes/no): ', (input) => ['yes', 'no'].includes(input.toLowerCase()) || 'Please enter yes or no.') === 'yes';
    const visa_sponsorship = await question('Set visa sponsorship? (yes/no): ', (input) => ['yes', 'no'].includes(input.toLowerCase()) || 'Please enter yes or no.') === 'yes';
    const status = await question('Initial status (Active/Inactive/Pending): ', enumValidator(['Active', 'Inactive', 'Pending']));

    const newSource: Record<string, any> = {
        sourceName,
        type,
        adapter,
        baseUrl,
        feedUrl: feedUrl || null,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        enabled,
        status,
        fetchFrequency: 'daily', // This can remain hardcoded for now
        lastFetchedAt: null,
        notes: 'Added via CLI',
        remote,
        visa_sponsorship,
    };

    if (maxPages !== null) {
        newSource.maxPages = maxPages;
    }
    if (minScore !== null) {
        newSource.minScore = minScore;
    }

    console.log('\n--- Review Source ---');
    console.table([newSource]);

    const confirmation = await question('Do you want to add this source to Firestore? (yes/no): ');

    if (confirmation.toLowerCase() === 'yes') {
        const db = getDb();
        await db.collection('sources').doc(sourceName).set(newSource);
        console.log('Source \'' + sourceName + '\' added successfully.');
    } else {
        console.log('Operation cancelled.');
    }
}


async function deleteSource() {
    console.log('--- Delete a Source (Interactive) ---');
    const db = getDb();
    const sourcesSnapshot = await db.collection('sources').get();

    if (sourcesSnapshot.empty) {
        console.log('No sources found to delete.');
        return;
    }

    const sources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Source[];

    console.log('Please select source(s) to delete:');
    sources.forEach((source, index) => {
        console.log((index + 1) + ': ' + source.sourceName + ' (ID: ' + source.id + ')');
    });

    const sourceIndicesStr = await question('\nEnter the number(s) of the source(s) to delete (comma-separated): ', (input) => {
        const indices = input.split(',').map(s => parseInt(s.trim(), 10) - 1);
        const allValid = indices.every(index => !isNaN(index) && index >= 0 && index < sources.length);
        return allValid || 'Please enter valid, comma-separated numbers between 1 and ' + sources.length + '.';
    });

    const indicesToDelete = sourceIndicesStr.split(',').map(s => parseInt(s.trim(), 10) - 1);
    const sourcesToDelete = indicesToDelete.map(index => sources[index]);

    console.log('\nYou have selected to delete the following sources:');
    sourcesToDelete.forEach(source => {
        console.log('- ' + source.sourceName + ' (ID: ' + source.id + ')');
    });

    const confirmation = await question('\nAre you sure you want to permanently delete these ' + sourcesToDelete.length + ' source(s)? (yes/no): ');

    if (confirmation.toLowerCase() === 'yes') {
        const deletePromises = sourcesToDelete.map(source => db.collection('sources').doc(source.id).delete());
        await Promise.all(deletePromises);
        console.log(sourcesToDelete.length + ' source(s) deleted successfully.');
    } else {
        console.log('Operation cancelled.');
    }
}

async function main() {
  const command = process.argv[2];

  if (!command) {
    console.error('Please provide a command: list, add, or delete');
    process.exit(1);
  }

  try {
    if (command === 'list') {
      await listSources();
    } else if (command === 'add') {
      await addSource();
    } else if (command === 'delete') {
      await deleteSource();
    } else {
      console.error('Unknown command: ' + command);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();
