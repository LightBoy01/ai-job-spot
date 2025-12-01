import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from 'octokit';
import { analyzeGithubPortfolio } from '@/lib/verification/githubVerifier';
import { GithubRepoSummary } from '@/lib/verification/types';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/data-pipeline/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Apply rate limiting
  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too Many Requests' });
  }

  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ message: 'Missing token or userId' });
  }

  // --- MOCK VERIFICATION PATH ---
  // Use a special token to trigger the "Perfect Profile" response for demos
  if (token === 'MOCK_VERIFICATION_TOKEN') {
    const mockResult = {
      claims: [
        {
          id: uuidv4(),
          userId: userId,
          platform: 'GITHUB',
          category: 'AI_ENGINEERING',
          assertion: "Maintainer of AI repository 'neural-architect' with 1,250 stars.",
          evidence: {
            sourceUrl: 'https://github.com/mock-user/neural-architect',
            snapshotHash: 'mock-hash-123',
            dataSummary: { repoName: 'neural-architect', stars: 1250, topics: ['deep-learning', 'pytorch'] }
          },
          verificationStatus: {
            verified: true,
            timestamp: new Date().toISOString(),
            method: 'OAUTH_API_DIRECT_READ',
            confidenceScore: 1.0
          }
        },
        {
          id: uuidv4(),
          userId: userId,
          platform: 'GITHUB',
          category: 'AI_ENGINEERING',
          assertion: "Active AI Engineer with 12 public repositories focused on Machine Learning/AI.",
          evidence: {
            sourceUrl: 'https://github.com',
            snapshotHash: 'mock-hash-456',
            dataSummary: { repoCount: 12, topLanguages: ['Python', 'C++'] }
          },
          verificationStatus: {
            verified: true,
            timestamp: new Date().toISOString(),
            method: 'OAUTH_API_DIRECT_READ',
            confidenceScore: 0.95
          }
        }
      ],
      dna: {
        topLanguages: [
          { name: 'Python', percentage: 75, color: '#3572A5' },
          { name: 'C++', percentage: 15, color: '#f34b7d' },
          { name: 'CUDA', percentage: 10, color: '#3A4E3A' }
        ],
        archetype: 'The Architect',
        activeReposCount: 8,
        totalStars: 2450,
        userType: 'Architect'
      }
    };
    return res.status(200).json(mockResult);
  }
  // --- END MOCK PATH ---

  try {
    const octokit = new Octokit({ auth: token });

    const iterator = octokit.paginate.iterator(octokit.rest.repos.listForAuthenticatedUser, {
      visibility: 'public',
      per_page: 100,
      sort: 'updated',
    });

    const repoSummaries: GithubRepoSummary[] = [];

    for await (const { data: repos } of iterator) {
      for (const repo of repos) {
        repoSummaries.push({
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language,
          topics: repo.topics || [],
          isFork: repo.fork,
          url: repo.html_url,
          updatedAt: repo.updated_at || new Date().toISOString(),
        });
      }
      if (repoSummaries.length >= 200) break;
    }

    const result = analyzeGithubPortfolio(repoSummaries, userId);

    logger.info({ userId, claimCount: result.claims.length }, 'Generated claims and DNA for user');

    return res.status(200).json(result);

  } catch (error: unknown) {
    logger.error({ error: String(error) }, 'Error verifying GitHub portfolio');
    return res.status(500).json({ message: 'Failed to verify GitHub portfolio' });
  }
}
