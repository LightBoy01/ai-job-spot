import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from 'octokit';
import { analyzeGithubPortfolio } from '@/lib/verification/githubVerifier';
import { GithubRepoSummary } from '@/lib/verification/types';
import { rateLimit } from '@/lib/rateLimit';
import logger from '@/data-pipeline/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Apply rate limiting
  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too Many Requests' });
  }

  // TODO: In a real app, we would get the token from the encrypted session or a secure cookie.
  // For the MVP "Connect" flow, the client might send the token immediately after OAuth.
  // Alternatively, and more securely, the token is stored in the DB during the OAuth callback,
  // and we just use the user's session ID to retrieve it.
  // For this implementation, we'll assume the client sends the token for the initial stateless check.
  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ message: 'Missing token or userId' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    // Fetch all public repositories for the authenticated user
    // Pagination handled by iterator for simplicity in MVP, but should be careful with limits
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
        });
      }
      // Safety break for MVP: Don't process more than 200 repos to avoid timeouts
      if (repoSummaries.length >= 200) break;
    }

    // Run the verification logic
    const generatedClaims = analyzeGithubPortfolio(repoSummaries, userId);

    logger.info({ userId, claimCount: generatedClaims.length }, 'Generated claims for user');

    return res.status(200).json({ claims: generatedClaims });

  } catch (error: unknown) {
    logger.error({ error: String(error) }, 'Error verifying GitHub portfolio');
    return res.status(500).json({ message: 'Failed to verify GitHub portfolio' });
  }
}
