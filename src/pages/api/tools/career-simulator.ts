import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  FirestoreJobPosting,
  SerializedArticleSummary,
  SerializedJobSummary,
} from '@/lib/types';
import type { NextApiRequest, NextApiResponse } from 'next';

// --- Hardcoded Career Graph for MVP ---
const careerGraph: Record<string, { title: string; nextSteps: string[] }> = {
  ai_ml_engineer: {
    title: 'AI / Machine Learning Engineer',
    nextSteps: ['senior_ai_ml_engineer', 'lead_ai_ml_engineer'],
  },
  data_scientist: {
    title: 'Data Scientist',
    nextSteps: ['senior_data_scientist', 'ai_ml_engineer'],
  },
  software_engineer: {
    title: 'Software Engineer',
    nextSteps: ['ai_ml_engineer', 'senior_software_engineer'],
  },
  // Define the target roles as well
  senior_ai_ml_engineer: {
    title: 'Senior AI / ML Engineer',
    nextSteps: [], // End of this path for MVP
  },
  lead_ai_ml_engineer: {
    title: 'Lead AI / ML Engineer',
    nextSteps: [],
  },
  senior_data_scientist: {
    title: 'Senior Data Scientist',
    nextSteps: [],
  },
  senior_software_engineer: {
    title: 'Senior Software Engineer',
    nextSteps: [],
  },
};

// Helper to find jobs matching a role key
const findJobsForRole = (
  roleKey: string,
  allJobs: FirestoreJobPosting[]
): FirestoreJobPosting[] => {
  const roleTitle = careerGraph[roleKey]?.title.toLowerCase();
  if (!roleTitle) return [];

  // Improved keyword-based matching.
  const keywords = roleTitle.split(' ').filter(k => k !== '/' && k !== '&' && k !== '-');

  return allJobs.filter((job) => {
    const jobTitleLower = job.title.toLowerCase();
    // Ensure all keywords are present in the job title
    return keywords.every(keyword => jobTitleLower.includes(keyword));
  });
};

// Helper to get top skills from a list of jobs
const getCommonSkills = (jobs: FirestoreJobPosting[], limit = 5): string[] => {
  const tagFrequency = new Map<string, number>();
  jobs.forEach((job) => {
    job.tags?.forEach((tag) => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0]);
};

export interface CareerPathStep {
  role: string;
  title: string;
  commonSkills: string[];
  relevantJobs: Partial<SerializedJobSummary>[];
  relevantArticles: Partial<SerializedArticleSummary>[]; // Placeholder for now
}

export interface CareerPathResponse {
  currentRole: {
    role: string;
    title: string;
  };
  nextSteps: CareerPathStep[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CareerPathResponse | { message: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { role } = req.query;

  if (
    !role ||
    typeof role !== 'string' ||
    !Object.keys(careerGraph).includes(role)
  ) {
    return res.status(400).json({ message: 'Valid role parameter is required.' });
  }

  // Set aggressive caching headers
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=43200, stale-while-revalidate=86400' // 12-hour cache, 24-hour stale-while-revalidate
  );

  try {
    const { adminDb } = await getFirebaseAdmin();

    const jobsSnapshot = await adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .select('id', 'title', 'company', 'location', 'tags') // Optimized query
      .get();

    const allJobs = jobsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as FirestoreJobPosting)
    );

    const currentRoleInfo = careerGraph[role];
    const nextStepKeys = currentRoleInfo.nextSteps;

    const nextStepsData: CareerPathStep[] = nextStepKeys.map((stepKey) => {
      const relevantJobsForStep = findJobsForRole(stepKey, allJobs);
      const commonSkills = getCommonSkills(relevantJobsForStep);

      const relevantJobSummaries: Partial<SerializedJobSummary>[] =
        relevantJobsForStep.slice(0, 3).map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
        }));

      return {
        role: stepKey,
        title: careerGraph[stepKey].title,
        commonSkills,
        relevantJobs: relevantJobSummaries,
        relevantArticles: [], // Placeholder for now
      };
    });

    const responseData: CareerPathResponse = {
      currentRole: {
        role: role,
        title: currentRoleInfo.title,
      },
      nextSteps: nextStepsData,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in career simulator API:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
