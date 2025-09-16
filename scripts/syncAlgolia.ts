import admin from 'firebase-admin';
const algoliasearch = require('algoliasearch');
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs/promises';



// --- INITIALIZATION ---

async function initializeClients() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
        try {
            const serviceAccountPath = path.resolve('serviceAccountKey.local.json');
            const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin SDK initialized successfully from local key.");
        } catch (error: any) {
            console.error("Firebase Admin SDK initialization error:", error.message);
            process.exit(1);
        }
    }

    const algoliaConfigPath = path.resolve('algolia.local.json');
    const algoliaConfig = JSON.parse(await fs.readFile(algoliaConfigPath, 'utf8'));

    const algoliaClient = algoliasearch(algoliaConfig.appId, algoliaConfig.adminKey);
    console.log("Algolia Admin Client initialized successfully.");

    return {
        firestoreDb: getFirestore(),
        algoliaIndex: algoliaClient.initIndex('ai_job_spot_prod'), // As decided
    };
}

// --- DATA FETCHING ---

async function fetchCollection(db: admin.firestore.Firestore, collectionName: string) {
    console.log(`Fetching all documents from '${collectionName}' collection...`);
    const snapshot = await db.collection(collectionName).get();
    const documents = snapshot.docs.map(doc => ({
        objectID: doc.id, // Use Firestore doc ID as Algolia objectID
        ...doc.data(),
    }));
    console.log(`Fetched ${documents.length} documents from ${collectionName}.`);
    return documents;
}

// --- MAIN SYNC LOGIC ---

async function syncAlgolia() {
    try {
        const { firestoreDb, algoliaIndex } = await initializeClients();

        // Fetch all jobs and articles from Firestore
        const jobs = await fetchCollection(firestoreDb, 'jobs');
        const articles = await fetchCollection(firestoreDb, 'articles');

        const recordsToSync = [...jobs, ...articles];

        if (recordsToSync.length === 0) {
            console.log("No documents found in Firestore. Nothing to sync.");
            return;
        }

        console.log(`Syncing a total of ${recordsToSync.length} records to Algolia index 'ai_job_spot_prod'...`);

        // Clear the index before syncing to ensure no stale data
        console.log("Clearing existing index...");
        await algoliaIndex.clearObjects();

        // Upload new records
        const { objectIDs } = await algoliaIndex.saveObjects(recordsToSync);
        console.log(`Successfully synced ${objectIDs.length} records to Algolia.`);

    } catch (error) {
        console.error("An error occurred during the Algolia sync process:", error);
        process.exit(1);
    }
}

// --- EXECUTE SCRIPT ---
syncAlgolia();
