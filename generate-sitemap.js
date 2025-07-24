const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);





admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getJobs() {
  const jobsSnapshot = await db.collection('jobs').orderBy('postedDate', 'desc').get();
  return jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getArticles() {
  const articlesSnapshot = await db.collection('articles').orderBy('publishDate', 'desc').get();
  return articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function generateSitemap() {
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

generateSitemap().catch(console.error);
