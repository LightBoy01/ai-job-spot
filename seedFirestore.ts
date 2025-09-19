import { admin, adminDb } from './src/lib/firebaseAdmin';
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
    author_take_question1: z.string().optional(),
    author_take_answer1: z.string().optional(),
    author_take_question2: z.string().optional(),
    author_take_answer2: z.string().optional(),
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
    source: z.string().nullable().optional(),
    glassdoorLink: z.string().url().nullable().optional(),
    crunchbaseLink: z.string().url().nullable().optional(),
    companyLogoUrl: z.string().nullable().optional(),
    applicationExperience: z.string().optional(),
    excerpt: z.string(), // Added by our script
    // These are now parsed from the body for jobs
    description: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    qualifications: z.array(z.string()).optional(),
    // Human Context Q&A
    story_question1: z.string().optional(),
    story_answer1: z.string().optional(),
    story_question2: z.string().optional(),
    story_answer2: z.string().optional(),
    story_question3: z.string().optional(),
    story_answer3: z.string().optional(),
});


// --- INITIALIZATION ---
(async () => {
    const db = adminDb;

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
                        processedContent = processedContent.replace(/\ \[\[Internal Link: (.*?)\]\]/g, (match, linkText) => {
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


    async function syncDeletions(collectionRef: admin.firestore.CollectionReference, localIds: Set<string>) {
        console.log(`Syncing deletions for collection: ${collectionRef.path}...`);
        const remoteSnapshot = await collectionRef.select().get();
        const remoteIds = new Set(remoteSnapshot.docs.map(doc => doc.id));
        const idsToDelete = [...remoteIds].filter(id => !localIds.has(id));

        if (idsToDelete.length === 0) {
            console.log(`No documents to delete from ${collectionRef.path}.`);
            return;
        }

        console.log(`Found ${idsToDelete.length} documents to delete from ${collectionRef.path}:`, idsToDelete);
        const deleteBatch = db.batch();
        idsToDelete.forEach(id => {
            deleteBatch.delete(collectionRef.doc(id));
        });

        await deleteBatch.commit();
        console.log(`Successfully deleted ${idsToDelete.length} orphaned documents from ${collectionRef.path}.`);
    }


    // --- MAIN SEEDING LOGIC ---

    async function seedData() {
        console.log('Starting intelligent Firestore data seeding from Markdown files...');

        const jobsCollection = db.collection('jobs');
        const articlesCollection = db.collection('articles');
        
        // Process local files first
        const processedJobs = await processDirectory(jobsDir);
        const processedArticles = await processDirectory(articlesDir);

        const localJobIds = new Set(processedJobs.map(j => j.id).filter(Boolean));
        const localArticleSlugs = new Set(processedArticles.map(a => a.slug).filter(Boolean));

        // Sync deletions
        await syncDeletions(jobsCollection, localJobIds);
        await syncDeletions(articlesCollection, localArticleSlugs);

        // Prepare upsert batch
        const upsertBatch = db.batch();
        let operationsCount = 0;

        console.log(`Found ${processedJobs.length} job files to process for upsert...`);
        for (const job of processedJobs) {
            if (!job.id) {
                console.warn(`[SKIPPING] Job file found without an 'id' in its frontmatter.`, job);
                continue;
            }
            const jobRef = jobsCollection.doc(job.id);
            // The spread operator `...job` carries all fields from the parsed markdown.
            // We only need to explicitly provide defaults for fields that might be missing
            // and are required to have a non-undefined value (like an empty array for tags).
            const jobToSeed = {
                ...job,
                tags: job.tags ?? [],
                responsibilities: job.responsibilities ?? [],
                qualifications: job.qualifications ?? [],
            };
            upsertBatch.set(jobRef, jobToSeed, { merge: true });
            operationsCount++;
        }

        console.log(`Found ${processedArticles.length} article files to process for upsert...`);
        for (const article of processedArticles) {
            if (!article.slug) {
                console.warn(`[SKIPPING] Article file found without a 'slug' in its frontmatter.`, article);
                continue;
            }
            const articleRef = articlesCollection.doc(article.slug);
            const articleToSeed = {
                ...article,
                tags: article.tags || [],
                imageUrl: article.imageUrl || null,
                author_take_question1: article.author_take_question1 || null,
                author_take_answer1: article.author_take_answer1 || null,
                author_take_question2: article.author_take_question2 || null,
                author_take_answer2: article.author_take_answer2 || null,
            };
            upsertBatch.set(articleRef, articleToSeed, { merge: true });
            operationsCount++;
        }

        if (operationsCount > 0) {
            try {
                await upsertBatch.commit();
                console.log(`Firestore upsert complete. Processed ${operationsCount} upsert operations.`);
            } catch (error) {
                console.error('Error committing upsert batch:', error);
            }
        } else {
            console.log('No valid Markdown files found to upsert. Firestore remains unchanged.');
        }
    }

    await seedData();
})().catch(console.error);