import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from 'octokit';
import { analyzeGithubPortfolio } from '@/lib/verification/githubVerifier';
import { GithubRepoSummary } from '@/lib/verification/types';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/data-pipeline/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

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

  // --- AUTHENTICATION CHECK ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  
  const { adminAuth, adminDb } = await getFirebaseAdmin();
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
        return res.status(403).json({ message: 'Forbidden: User ID mismatch.' });
    }
  } catch (e) {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
  // --- END AUTHENTICATION CHECK ---

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
          assertion: "Core Contributor to 'pytorch/vision': Merged 12 PRs impacting model latency.",
          evidence: {
            sourceUrl: 'https://github.com/pytorch/vision',
            snapshotHash: 'mock-hash-123',
            dataSummary: { repoName: 'pytorch/vision', stars: 74000, topics: ['computer-vision', 'deep-learning', 'pytorch'] }
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
          assertion: "Maintains 'neural-search-engine' (2.4k stars) - A production-ready RAG pipeline.",
          evidence: {
            sourceUrl: 'https://github.com/mock-user/neural-search-engine',
            snapshotHash: 'mock-hash-456',
            dataSummary: { repoName: 'neural-search-engine', stars: 2400, topics: ['rag', 'llm', 'vector-database'] }
          },
          verificationStatus: {
            verified: true,
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            method: 'OAUTH_API_DIRECT_READ',
            confidenceScore: 1.0
          }
        },
        {
          id: uuidv4(),
          userId: userId,
          platform: 'GITHUB',
          category: 'AI_ENGINEERING',
          assertion: "Top 5% Contributor in 'Natural Language Processing' based on commit frequency.",
          evidence: {
            sourceUrl: 'https://github.com',
            snapshotHash: 'mock-hash-789',
            dataSummary: { topic: 'nlp', percentile: 5, commitCount: 342 }
          },
          verificationStatus: {
            verified: true,
            timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
            method: 'OAUTH_API_DIRECT_READ',
            confidenceScore: 0.95
          }
        },
        {
          id: uuidv4(),
          userId: userId,
          platform: 'GITHUB',
          category: 'AI_ENGINEERING',
          assertion: "Consistent Open Source Activity: 52 weeks of uninterrupted contributions.",
          evidence: {
            sourceUrl: 'https://github.com',
            snapshotHash: 'mock-hash-101',
            dataSummary: { streakWeeks: 52, totalContributions: 1250 }
          },
          verificationStatus: {
            verified: true,
            timestamp: new Date().toISOString(),
            method: 'OAUTH_API_DIRECT_READ',
            confidenceScore: 0.98
          }
        }
      ],
      dna: {
        topLanguages: [
          { name: 'Python', percentage: 65, color: '#3572A5' },
          { name: 'C++', percentage: 20, color: '#f34b7d' },
          { name: 'Rust', percentage: 10, color: '#dea584' },
          { name: 'CUDA', percentage: 5, color: '#76B900' }
        ],
        archetype: 'The Visionary',
        activeReposCount: 24,
        totalStars: 12500,
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

    // Persist to Firestore
    // adminDb is already initialized in the auth check block
    const userRef = adminDb.collection('users').doc(userId);

    await userRef.set({
        verifiedClaims: result.claims,
        developerDNA: result.dna,
        lastVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info({ userId, claimCount: result.claims.length }, 'Generated and saved claims and DNA for user');

    return res.status(200).json(result);

  } catch (error: unknown) {
    logger.error({ error: String(error) }, 'Error verifying GitHub portfolio');
    return res.status(500).json({ message: 'Failed to verify GitHub portfolio' });
  }
}
