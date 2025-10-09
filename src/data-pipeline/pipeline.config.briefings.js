import { getFirebaseAdmin } from '../lib/firebaseAdmin.js';
export async function getBriefingSources() {
    const { adminDb } = await getFirebaseAdmin();
    const sourcesSnapshot = await adminDb.collection('sources').where('type', '==', 'Article').get();
    if (sourcesSnapshot.empty) {
        console.log('No article sources found in Firestore.');
        return [];
    }
    return sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
