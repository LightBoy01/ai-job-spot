
import admin from 'firebase-admin';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin
// The service account is loaded from an environment variable for security
const serviceAccount = require('/data/data/com.termux/files/home/storage/downloads/FIREBASE_SERVICE_ACCOUNT.json');

if (serviceAccount.project_id) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.error('Firebase service account credentials not found. Make sure FIREBASE_SERVICE_ACCOUNT env var is set.');
    process.exit(1);
}

const db = admin.firestore();

// --- TYPE DEFINITIONS ---
interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    jobLevel: string | null;
    employeeRole?: string | null;
    applicationLink: string;
    postedDate: admin.firestore.Timestamp;
    expirationDate?: admin.firestore.Timestamp;
    tags: string[];
    status: 'published' | 'pending_review' | 'archived';
    isNew?: boolean;
    salaryRange?: string | null;
    source?: string;
    markdownFile: string;
    description?: string; // To be populated from markdown
    responsibilities?: string[]; // To be populated from markdown
    qualifications?: string[]; // To be populated from markdown
    preferredQualifications?: string[]; // To be populated from markdown
}

interface Article {
    slug: string;
    title: string;
    author: string;
    publishDate: admin.firestore.Timestamp;
    issueNo: number;
    volumeNo: number;
    markdownFile: string;
    tags?: string[];
    imageUrl?: string;
    contentBody?: string; // To be populated from markdown
}

// --- FILE READING HELPERS ---

const articlesDir = path.join(__dirname, 'src', 'articles');
const jobsDir = path.join(__dirname, 'src', 'job-descriptions');

const getArticleContent = (markdownFile: string): string => {
    const markdownFilePath = path.join(articlesDir, markdownFile);
    try {
        const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
        return marked(markdownContent) as string;
    } catch (error) {
        console.error(`Error reading or converting Markdown file ${markdownFile}:`, error);
        return '';
    }
};

const getJobContent = (markdownFile: string): Partial<Job> => {
    const markdownFilePath = path.join(jobsDir, markdownFile);
    try {
        const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
        // A simple parser for our structured markdown
        const job: Partial<Job> = {};
        const sections = markdownContent.split(/\n### /g);

        const header = sections[0].split('---\n')[0];
        job.description = marked(sections.find(s => s.startsWith('Description'))?.replace('Description\n\n', '') || '') as string;

        const responsibilitiesRaw = sections.find(s => s.startsWith('Responsibilities'))?.replace('Responsibilities\n\n', '');
        job.responsibilities = responsibilitiesRaw ? responsibilitiesRaw.split('\n- ').slice(1).map(r => r.trim()) : [];

        const qualificationsRaw = sections.find(s => s.startsWith('Qualifications'))?.replace('Qualifications\n\n', '');
        job.qualifications = qualificationsRaw ? qualificationsRaw.split('\n- ').slice(1).map(q => q.trim()) : [];

        const preferredQualificationsRaw = sections.find(s => s.startsWith('Preferred Qualifications'))?.replace('Preferred Qualifications\n\n', '');
        job.preferredQualifications = preferredQualificationsRaw ? preferredQualificationsRaw.split('\n- ').slice(1).map(p => p.trim()) : [];

        return job;
    } catch (error) {
        console.error(`Error reading or converting Markdown file ${markdownFile}:`, error);
        return {
            description: '',
            responsibilities: [],
            qualifications: [],
            preferredQualifications: []
        };
    }
}

// --- DATA DEFINITIONS (CLEAN) ---

const jobs: Job[] = [
    // Job data is now minimal, content will be loaded from markdown
    { id: 'job-16', title: 'Machine Learning Engineer', company: 'Scale AI', location: 'San Francisco, CA', jobLevel: 'Mid-Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://scale.com/careers', postedDate: admin.firestore.Timestamp.fromDate(new Date()), tags: ['Machine Learning', 'NLP', 'LLM', 'Python', 'Full-Time'], status: 'published', markdownFile: 'job-16.md' },
    { id: 'job-17', title: 'Manager, Machine Learning (Generative AI & Content Understanding)', company: 'Netflix', location: 'Los Gatos, CA', jobLevel: 'Manager', employeeRole: 'People Manager', applicationLink: 'https://jobs.netflix.com/', postedDate: admin.firestore.Timestamp.fromDate(new Date()), tags: ['Generative AI', 'Management', 'Machine Learning', 'Content Discovery'], status: 'published', markdownFile: 'job-17.md' },
    { id: 'job-18', title: 'Research Engineer, Science (LLM)', company: 'Google DeepMind', location: 'London, UK', jobLevel: 'Research Engineer', employeeRole: 'Individual Contributor', applicationLink: 'https://deepmind.google/careers/', postedDate: admin.firestore.Timestamp.fromDate(new Date()), tags: ['Research', 'LLM', 'Science', 'JAX', 'TensorFlow'], status: 'published', markdownFile: 'job-18.md' },
    { id: 'job-scraped-google-data-scientist-iii,-product,-applied-ai,-developer-productivity', title: 'Data Scientist III, Product, Applied AI, Developer Productivity', company: 'Google', location: 'Mountain View, CA, USA', applicationLink: 'https://www.google.com/about/careers/applications/jobs/results/103109554304099014-data-scientist-iii-product-applied-ai-developer-productivity', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-15T10:00:00Z')), salaryRange: null, jobLevel: null, isNew: false, tags: ['Google', 'AI', 'Mountain View', 'Scraped', 'Data Science'], source: 'foorilla_jobs.json', status: 'published', markdownFile: 'job-scraped-google-data-scientist-iii,-product,-applied-ai,-developer-productivity.md' },
    { id: 'job-scraped-foorilla-20250807-1', title: 'Senior Machine Learning Engineer, Generative AI', company: 'ByteDance', location: 'Mountain View, CA', jobLevel: 'Senior', employeeRole: 'Individual Contributor', salaryRange: null, tags: ['Generative AI', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Full-time'], postedDate: admin.firestore.Timestamp.fromDate(new Date()), applicationLink: 'https://jobs.bytedance.com/en/position/7504040732648081671/detail', status: 'published', markdownFile: 'job-scraped-foorilla-20250807-1.md' },
    { id: 'job-21', title: 'AI Research Scientist (Model Development)', company: 'Chan Zuckerberg Initiative', location: 'Redwood City, CA', jobLevel: 'Senior Researcher', employeeRole: 'Individual Contributor', applicationLink: 'https://chanzuckerberg.com/careers/job-openings/', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['AI Research', 'Model Development', 'Data Labeling', 'PyTorch', 'Biology'], status: 'published', isNew: true, markdownFile: 'job-21.md' },
    { id: 'job-22', title: 'Senior Machine Learning Engineer, Siri', company: 'Apple', location: 'Cupertino, CA', jobLevel: 'Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://www.apple.com/careers/us/', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['ML Engineer', 'Siri', 'NLP', 'On-Device AI', 'Apple'], status: 'published', isNew: true, markdownFile: 'job-22.md' },
    { id: 'job-23', title: 'Data Scientist, Generative AI', company: 'PwC', location: 'Remote', jobLevel: 'Senior Associate', employeeRole: 'Consultant', applicationLink: 'https://www.pwc.com/us/en/careers.html', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['Data Scientist', 'Generative AI', 'LLM', 'Consulting', 'Remote'], status: 'published', isNew: true, markdownFile: 'job-23.md' },
    { id: 'job-24', title: 'Chatbot Developer, Dialogflow', company: 'Turing', location: 'Remote', jobLevel: 'Mid-Level', employeeRole: 'Individual Contributor', applicationLink: 'https://www.turing.com/jobs', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['Chatbot Developer', 'Dialogflow', 'Conversational AI', 'NLP', 'Remote'], status: 'published', isNew: true, markdownFile: 'job-24.md' },
    { id: 'job-25', title: 'AI Content Creator', company: 'Marketing Architects', location: 'Minneapolis, MN', jobLevel: 'Associate', employeeRole: 'Individual Contributor', applicationLink: 'https://www.marketingarchitects.com/careers', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['AI Content', 'Content Creator', 'Generative AI', 'Marketing', 'Copywriting'], status: 'published', isNew: true, markdownFile: 'job-25.md' },
    { id: 'job-26', title: 'Prompt & Context Engineer', company: 'NTT DATA', location: 'Irving, TX', jobLevel: 'Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://us.nttdata.com/en/careers', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T11:00:00Z')), tags: ['Prompt Engineer', 'Context Engineer', 'LLM', 'AI Strategy', 'NTT DATA'], status: 'published', isNew: true, markdownFile: 'job-26.md' },
    { id: 'job-27', title: 'Machine Learning Engineer, Core Products', company: 'Roblox', location: 'San Mateo, CA', jobLevel: 'Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://careers.roblox.com/jobs', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['ML Engineer', 'Roblox', 'NLP', 'Deep Learning', 'San Mateo'], status: 'published', isNew: true, markdownFile: 'job-27.md' },
    { id: 'job-28', title: 'Data Scientist (AI/ML Focus)', company: 'Mind To Machine Connect', location: 'Remote', jobLevel: 'Mid-Level', employeeRole: 'Individual Contributor', applicationLink: 'https://m2mtechconnect.com/careers/', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['Data Scientist', 'AI/ML', 'Python', 'SQL', 'Remote'], status: 'published', isNew: true, markdownFile: 'job-28.md' },
    { id: 'job-29', title: 'AI Automation Engineer', company: 'A Techstars Portfolio Company', location: 'Remote', jobLevel: 'Mid-Level', employeeRole: 'Individual Contributor', applicationLink: 'https://jobs.techstars.com/jobs', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['AI Automation', 'Techstars', 'RPA', 'Startup', 'Remote'], status: 'published', isNew: true, markdownFile: 'job-29.md' },
    { id: 'job-30', title: 'Prompt Engineer', company: 'Anthropic', location: 'San Francisco, CA', jobLevel: 'Mid-Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://www.anthropic.com/careers', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['Prompt Engineer', 'Anthropic', 'LLM', 'AI Safety', 'San Francisco'], status: 'published', isNew: true, markdownFile: 'job-30.md' },
    { id: 'job-31', title: 'Generative AI Artist (Video)', company: 'Runway', location: 'New York, NY (Hybrid)', jobLevel: 'Mid-Level', employeeRole: 'Creative', applicationLink: 'https://runwayml.com/careers/', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['AI Video', 'Generative Art', 'Runway', 'Creative', 'New York'], status: 'published', isNew: true, markdownFile: 'job-31.md' },
    { id: 'job-32', title: 'AI Ethicist, Responsible AI', company: 'Google', location: 'Mountain View, CA', jobLevel: 'Senior', employeeRole: 'Individual Contributor', applicationLink: 'https://careers.google.com/', postedDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T10:00:00Z')), tags: ['AI Ethics', 'Responsible AI', 'Google', 'Policy', 'Mountain View'], status: 'published', isNew: true, markdownFile: 'job-32.md' },
];

const articles: Article[] = [
    { slug: 'the-emerging-trinity-of-ai-work', title: 'The Emerging Trinity of AI Work: The Trainers, The Explainers, and The Sustainers', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-20T12:00:00Z')), issueNo: 26, volumeNo: 1, markdownFile: 'the-emerging-trinity-of-ai-work.md', tags: ['AI Careers', 'Future of Work', 'Career Strategy', 'Mental Models', 'Job Roles'] },
    { slug: 'the-gravity-engine', title: 'The Gravity Engine: How to Become the Center of Value in a Decentralized Workforce', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-19T10:00:00Z')), issueNo: 25, volumeNo: 1, markdownFile: 'the-gravity-engine.md', tags: ['Influence', 'Career Strategy', 'Leadership', 'Future of Work', 'Mental Models'], imageUrl: '/images/articles/the-gravity-engine.png' },
    { slug: 'the-anti-portfolio-career', title: 'The "Anti-Portfolio" Career: How to Build Your Professional Moat in the Age of AI', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-07T10:00:00Z')), issueNo: 21, volumeNo: 1, markdownFile: 'the-anti-portfolio-career.md', tags: ['Career Strategy', 'AI', 'Future of Work', 'Mental Models', 'Adaptability'] },
    { slug: 'the-signal-in-the-silence', title: 'The Signal in the Silence: Reclaiming the Power of Boredom in a World of Intelligent Noise', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-04T10:00:00Z')), issueNo: 20, volumeNo: 1, markdownFile: 'the-signal-in-the-silence.md', tags: ['Deep Work', 'Creativity', 'Strategy', 'Philosophy', 'Future of Work'] },
    { slug: 'the-rise-of-generative-ai', title: 'The Rise of Generative AI: A New Era of Creativity', author: 'AI Job Spot Team', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-03T08:00:00Z')), issueNo: 1, volumeNo: 1, markdownFile: 'the-rise-of-generative-ai.md' },
    { slug: 'ai-in-cybersecurity', title: 'AI in Cybersecurity: Protecting Digital Frontiers', author: 'CyberSec Insights', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-05T11:00:00Z')), issueNo: 3, volumeNo: 1, markdownFile: 'ai-in-cybersecurity.md' },
    { slug: 'ai-in-education-personalizing-learning', title: 'AI in Education: Personalizing Learning and Empowering Educators', author: 'EduTech Innovators', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-27T13:00:00Z')), issueNo: 5, volumeNo: 1, markdownFile: 'ai-in-education-personalizing-learning.md' },
    { slug: 'ai-in-finance', title: 'AI in Finance: Transforming Banking, Trading, and Fraud Detection', author: 'FinTech Insights', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-06-30T10:00:00Z')), issueNo: 7, volumeNo: 1, markdownFile: 'ai-in-finance.md' },
    { slug: 'the-importance-of-soft-skills-in-ai', title: 'The Importance of Soft Skills in the AI Job Market: Beyond the Code', author: 'AI Job Spot Team', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-07T10:00:00Z')), issueNo: 9, volumeNo: 1, markdownFile: 'the-importance-of-soft-skills-in-ai.md' },
    { slug: 'proactive-ai-in-job-industry', title: 'Proactive AI in the Job Industry: Anticipating Needs and Shaping Futures', author: 'AI Job Spot Team', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-07T11:00:00Z')), issueNo: 10, volumeNo: 1, markdownFile: 'proactive-ai-in-job-industry.md' },
    { slug: 'unseen-foundations-job-industry', title: 'Unseen Foundations: Three Overlooked Principles Shaping Success in the Modern Job Industry', author: 'AI Job Spot Team', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-11T12:00:00Z')), issueNo: 11, volumeNo: 1, markdownFile: 'unseen-foundations-job-industry.md' },
    { slug: 'echoes-in-the-oracle', title: 'Echoes in the Oracle: The Timeless Art of Asking the Right Question', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-12T09:00:00Z')), issueNo: 12, volumeNo: 1, markdownFile: 'echoes-in-the-oracle.md', tags: ['Philosophy', 'AI', 'Innovation', 'Critical Thinking'] },
    { slug: 'the-last-human-frontier-deep-work', title: 'The Last Human Frontier: Mastering Deep Work When AI Masters Everything Else', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-28T10:00:00Z')), issueNo: 13, volumeNo: 1, markdownFile: 'the-last-human-frontier-deep-work.md', tags: ['Deep Work', 'AI', 'Focus', 'Productivity', 'Human Skills'] },
    { slug: 'the-polymaths-secret-analogical-thinking', title: 'The Polymath\'s Secret: Cultivating Analogical Thinking in an Age of Specialization', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-28T11:00:00Z')), issueNo: 14, volumeNo: 1, markdownFile: 'the-polymaths-secret-analogical-thinking.md', tags: ['Analogical Thinking', 'Innovation', 'Creativity', 'Polymath', 'Human Skills'] },
    { slug: 'the-trust-protocol-human-connection', title: 'The Trust Protocol: Engineering Human Connection in a Digitally Mediated Workforce', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-28T12:00:00Z')), issueNo: 15, volumeNo: 1, markdownFile: 'the-trust-protocol-human-connection.md', tags: ['Trust', 'Human Connection', 'Workforce', 'AI Ethics', 'Collaboration'] },
    { slug: 'the-virtue-of-intellectual-humility', title: 'The Virtue of Intellectual Humility: The AI Era\'s Most Undervalued Skill', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-29T00:00:00Z')), issueNo: 16, volumeNo: 1, markdownFile: 'the-virtue-of-intellectual-humility.md', tags: ['Intellectual Humility', 'AI Ethics', 'Learning', 'Collaboration', 'Innovation'] },
    { slug: 'the-unseen-hand-ai-logistics', title: 'The Unseen Hand: How AI-Powered Logistics is Quietly Remaking Our World', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-31T09:00:00Z')), issueNo: 17, volumeNo: 1, markdownFile: 'the-unseen-hand-ai-logistics.md', tags: ['AI', 'Logistics', 'Supply Chain', 'Automation', 'Efficiency'] },
    { slug: 'the-polymaths-advantage-thriving-in-the-age-of-ai-specialization', title: 'The Polymath\'s Advantage: Thriving in the Age of AI Specialization', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-07-31T10:00:00Z')), issueNo: 18, volumeNo: 1, markdownFile: 'the-polymaths-advantage-thriving-in-the-age-of-ai-specialization.md', tags: ['Polymath', 'Generalist', 'Specialist', 'AI', 'Future of Work'] },
    { slug: 'the-flexible-mind-cultivating-unlearning', title: 'The Flexible Mind: Cultivating Unlearning as a Core Skill for AI-Driven Careers', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-01T09:00:00Z')), issueNo: 19, volumeNo: 1, markdownFile: 'the-flexible-mind-cultivating-unlearning.md' },
    { slug: 'the-resilient-mind', title: 'The Resilient Mind: Forging an Inner Citadel in the Age of AI', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-16T10:00:00Z')), issueNo: 22, volumeNo: 1, markdownFile: 'the-resilient-mind.md', tags: ['Resilience', 'Stoicism', 'Mindfulness', 'Future of Work', 'Psychology'] },
    { slug: 'the-moral-compass', title: 'The Moral Compass: Navigating the Ethical Labyrinth of an AI-Powered World', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-17T10:00:00Z')), issueNo: 23, volumeNo: 1, markdownFile: 'the-moral-compass.md', tags: ['Ethics', 'AI', 'Strategy', 'Leadership', 'Moral Compass'] },
    { slug: 'the-unvarnished-mirror', title: 'The Unvarnished Mirror: Why Intellectual Honesty is Your Most Defensible Career Asset', author: 'The AI Strategist', publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-08-18T10:00:00Z')), issueNo: 24, volumeNo: 1, markdownFile: 'the-unvarnished-mirror.md', tags: ['Intellectual Honesty', 'AI', 'Career Strategy', 'Mental Models', 'Critical Thinking'] },
];


async function seedData() {
  console.log('Starting Firestore data seeding...');

  const jobsCollection = db.collection('jobs');
  const articlesCollection = db.collection('articles');

  // Use a batch for atomic writes
  const batch = db.batch();

  // Seed Jobs
  for (const job of jobs) {
    const jobRef = jobsCollection.doc(job.id);
    const content = getJobContent(job.markdownFile);
    const jobToSeed = { ...job, ...content };

    if (!jobToSeed.expirationDate && jobToSeed.postedDate) {
      const postedDateMillis = jobToSeed.postedDate.toMillis();
      const expirationDate = new Date(postedDateMillis);
      expirationDate.setDate(expirationDate.getDate() + 7);
      jobToSeed.expirationDate = admin.firestore.Timestamp.fromDate(expirationDate);
    }
    batch.set(jobRef, jobToSeed, { merge: true });
    console.log(`Staged job for seeding: ${job.title}`);
  }

  // Seed Articles
  for (const article of articles) {
    const articleRef = articlesCollection.doc(article.slug);
    const contentBody = getArticleContent(article.markdownFile);
    const articleToSeed = { ...article, contentBody };
    batch.set(articleRef, articleToSeed, { merge: true });
    console.log(`Staged article for seeding: ${article.title}`);
  }

  try {
    await batch.commit();
    console.log('Firestore data seeding complete. All jobs and articles have been successfully written.');
  } catch (error) {
    console.error('Error committing batch:', error);
  }
}

seedData().catch(console.error);
