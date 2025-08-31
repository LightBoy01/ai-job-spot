import admin from 'firebase-admin';
import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// --- ZOD SCHEMAS ---
const articleSchema = z.object({
    slug: z.string(),
    title: z.string(),
    author: z.string(),
    publishDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
    issueNo: z.number(),
    volumeNo: z.number(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
    excerpt: z.string(), // Added by our script
});

const jobSchema = z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    applicationLink: z.string().url(),
    postedDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
    expirationDate: z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.string(),
    jobLevel: z.string().nullable().optional(),
    employeeRole: z.string().nullable().optional(),
    salaryRange: z.string().nullable().optional(),
    source: z.string().optional(),
    excerpt: z.string(), // Added by our script
    // These are now parsed from the body for jobs
    description: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    qualifications: z.array(z.string()).optional(),
});


// --- INITIALIZATION ---
(async () => {
    if (!admin.apps.length) {
        try {
            const serviceAccountPath = path.resolve('serviceAccountKey.local.json');
            const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin SDK initialized successfully from local key.");
        } catch (error) {
            console.error("Firebase Admin SDK initialization error:", error);
            console.log("Please ensure a 'serviceAccountKey.local.json' file exists in the project root.");
            process.exit(1);
        }
    }

    const db = admin.firestore();

    // --- DYNAMIC CONTENT PROCESSING ---

    const projectRoot = process.cwd();
    const articlesDir = path.join(projectRoot, 'src', 'articles');
    const jobsDir = path.join(projectRoot, 'src', 'job-descriptions');

    /**
     * Reads all markdown files in a directory, parses their frontmatter and content.
     * @param {string} directoryPath The absolute path to the directory to scan.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of content objects.
     */
    async function processDirectory(directoryPath: string): Promise<any[]> {
        const items = [];
        const isJobsDir = directoryPath.includes('job-descriptions');
        try {
            const files = await fs.readdir(directoryPath);
            for (const file of files) {
                if (path.extname(file) === '.md') {
                    const filePath = path.join(directoryPath, file);
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const { data, content } = matter(fileContent);

                    // Create a plain text excerpt
                    const plainTextContent = content.replace(/\n/g, ' ').replace(/(\*\*|\*|_|`|\[|\]|\(|\)|#)/g, '');
                    data.excerpt = plainTextContent.substring(0, 160);
                    
                    let finalData: any = { ...data };

                    if (isJobsDir) {
                        // --- PARSE JOB CONTENT ---
                        let description = content;
                        let responsibilities: string[] = [];
                        let qualifications: string[] = [];

                        const respRegex = /\n###\s+Responsibilities\n/i;
                        const qualRegex = /\n###\s+Qualifications\n/i;

                        const qualMatch = content.match(qualRegex);
                        const respMatch = content.match(respRegex);

                        let respIndex = respMatch ? respMatch.index ?? -1 : -1;
                        let qualIndex = qualMatch ? qualMatch.index ?? -1 : -1;

                        if (qualIndex !== -1) {
                            qualifications = content.substring(qualIndex + qualMatch![0].length)
                                .split('\n')
                                .map(s => s.replace(/^\s*-\s*/, '').trim())
                                .filter(s => s);
                        }

                        if (respIndex !== -1) {
                            const respEndIndex = qualIndex !== -1 ? qualIndex : content.length;
                            responsibilities = content.substring(respIndex + respMatch![0].length, respEndIndex)
                                .split('\n')
                                .map(s => s.replace(/^\s*-\s*/, '').trim())
                                .filter(s => s);
                        }

                        const firstHeadingIndex = respIndex !== -1 ? respIndex : (qualIndex !== -1 ? qualIndex : content.length);
                        description = content.substring(0, firstHeadingIndex).trim();
                        
                        finalData.description = DOMPurify.sanitize(await marked(description));
                        finalData.responsibilities = responsibilities;
                        finalData.qualifications = qualifications;

                    } else {
                        // Process custom placeholders for articles
                        let processedContent = content;
                        if (data.imageUrl) {
                            processedContent = processedContent.replace(/\ \[\[Featured Image:.*?\ \]/g, `<img src="${data.imageUrl}" alt="${data.title}" class="w-full h-auto rounded-lg my-8" />`);
                        }
                        processedContent = processedContent.replace(/\ \[\[Internal Link: (.*?)\ \]/g, (match, linkText) => {
                            return `<a href="/articles/${linkText.toLowerCase().replace(/\s+/g, '-')}" class="text-secondary-dark hover:underline">${linkText}</a>`;
                        });
                        processedContent = processedContent.replace(/\ \[\[External Link: (.*?)\ \]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-secondary-dark hover:underline">$1</a>');
                        finalData.contentBody = DOMPurify.sanitize(await marked(processedContent));
                    }

                    // --- VALIDATION ---
                    try {
                        if (isJobsDir) {
                            jobSchema.parse(finalData);
                        } else {
                            articleSchema.parse(finalData);
                        }
                    } catch (error) {
                        console.error(`[VALIDATION FAILED] for ${file}:`, error);
                        continue; // Skip this file
                    }

                    // Convert dates to Firestore Timestamps before pushing
                    if (finalData.postedDate) {
                        finalData.postedDate = admin.firestore.Timestamp.fromDate(new Date(finalData.postedDate));
                    }
                    if (finalData.expirationDate) {
                        finalData.expirationDate = admin.firestore.Timestamp.fromDate(new Date(finalData.expirationDate));
                    }
                    if (finalData.publishDate) {
                        finalData.publishDate = admin.firestore.Timestamp.fromDate(new Date(finalData.publishDate));
                    }

                    items.push(finalData);
                }
            }
        } catch (error) {
            console.error(`Error processing directory ${directoryPath}:`, error);
        }
        return items;
    }


    // --- MAIN SEEDING LOGIC ---

    async function seedData() {
        console.log('Starting intelligent Firestore data seeding from Markdown files...');

        const jobsCollection = db.collection('jobs');
        const articlesCollection = db.collection('articles');
        const batch = db.batch();
        let operationsCount = 0;

        // Process and upsert jobs
        const jobs = await processDirectory(jobsDir);
        console.log(`Found ${jobs.length} job files to process...`);
        for (const job of jobs) {
            if (!job.id) {
                console.warn(`[SKIPPING] Job file found without an 'id' in its frontmatter.`, job);
                continue;
            }
            const jobRef = jobsCollection.doc(job.id);
            // Ensure there are no undefined values that Firestore rejects
            const jobToSeed = {
                ...job,
                salaryRange: job.salaryRange || null,
                jobLevel: job.jobLevel || null,
                employeeRole: job.employeeRole || null,
                source: job.source || null,
                tags: job.tags || [],
                description: job.description || '',
                responsibilities: job.responsibilities || [],
                qualifications: job.qualifications || [],
            };
            batch.set(jobRef, jobToSeed, { merge: true });
            operationsCount++;
        }

        // Process and upsert articles
        const articles = await processDirectory(articlesDir);
        console.log(`Found ${articles.length} article files to process...`);
        for (const article of articles) {
            if (!article.slug) {
                console.warn(`[SKIPPING] Article file found without a 'slug' in its frontmatter.`, article);
                continue;
            }
            const articleRef = articlesCollection.doc(article.slug);
            const articleToSeed = {
                ...article,
                tags: article.tags || [],
                imageUrl: article.imageUrl || null,
            };
            batch.set(articleRef, articleToSeed, { merge: true });
            operationsCount++;
        }

        if (operationsCount > 0) {
            try {
                await batch.commit();
                console.log(`Firestore seeding complete. Processed ${operationsCount} upsert operations.`);
            } catch (error) {
                console.error('Error committing batch:', error);
            }
        } else {
            console.log('No valid Markdown files found to seed. Firestore remains unchanged.');
        }
    }

    await seedData();
})().catch(console.error);