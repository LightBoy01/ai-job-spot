const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Temporary file for Firebase service account key
const TEMP_KEY_FILE = path.join(__dirname, 'temp_firebase_key.json');

let db; // Declare db outside to be accessible after initialization

async function initializeFirebase() {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }

  try {
    // Decode Base64 and write to a temporary file
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    fs.writeFileSync(TEMP_KEY_FILE, serviceAccountJson);

    // Initialize Firebase Admin SDK using the temporary file
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), // Use applicationDefault to pick up GOOGLE_APPLICATION_CREDENTIALS
    });

    // Set GOOGLE_APPLICATION_CREDENTIALS to the temporary file path
    process.env.GOOGLE_APPLICATION_CREDENTIALS = TEMP_KEY_FILE;

    db = admin.firestore(); // Initialize db AFTER app is initialized

  } catch (error) {
    console.error('Error initializing Firebase with temporary key file:', error);
    throw error;
  }
}

async function getJobs() {
  // Ensure db is initialized before use
  if (!db) {
    throw new Error('Firestore DB not initialized. Call initializeFirebase() first.');
  }
  const jobsSnapshot = await db.collection('jobs').orderBy('postedDate', 'desc').get();
  return jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getArticles() {
  // Ensure db is initialized before use
  if (!db) {
    throw new Error('Firestore DB not initialized. Call initializeFirebase() first.');
  }
  const articlesSnapshot = await db.collection('articles').orderBy('publishDate', 'desc').get();
  return articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function generateSitemapContent() {
  const baseUrl = 'https://www.ai-job-spot.com';
  const jobs = await getJobs();
  const articles = await getArticles();

  const jobUrls = jobs.map(job => {
    return `
      <url>
        <loc>${baseUrl}/jobs/${job.id}</loc>
        <lastmod>${new Date(job.postedDate._seconds * 1000).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
    `;
  }).join('');

  const articleUrls = articles.map(article => {
    return `
      <url>
        <loc>${baseUrl}/articles/${article.slug}</loc>
        <lastmod>${new Date(article.publishDate._seconds * 1000).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `;
  }).join('');

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/articles</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      ${jobUrls}
      ${articleUrls}
    </urlset>
  `;

  fs.writeFileSync(path.resolve(__dirname, 'public', 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
}

// Main execution flow
initializeFirebase()
  .then(generateSitemapContent) // Call generateSitemapContent after Firebase is initialized
  .catch(error => {
    console.error('Sitemap generation failed:', error);
  })
  .finally(() => {
    // Clean up the temporary file
    if (fs.existsSync(TEMP_KEY_FILE)) {
      fs.unlinkSync(TEMP_KEY_FILE);
      console.log('Cleaned up temporary Firebase key file.');
    }
  });
