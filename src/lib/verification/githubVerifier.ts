import { GithubRepoSummary, VerifiedClaim } from './types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Analyzes a list of GitHub repositories to find AI-relevant engineering work.
 * @param repos List of repositories fetched from GitHub API
 * @param userId The internal user ID to associate the claim with
 */
export function analyzeGithubPortfolio(repos: GithubRepoSummary[], userId: string): VerifiedClaim[] {
  const claims: VerifiedClaim[] = [];
  
  // Define AI-specific keywords
  const aiTopics = ['machine-learning', 'deep-learning', 'nlp', 'computer-vision', 'pytorch', 'tensorflow', 'llm', 'generative-ai', 'rag', 'transformers', 'huggingface'];
  
  const aiRepos = repos.filter(repo => {
    // 1. Check topics
    const hasAiTopic = repo.topics.some(topic => aiTopics.includes(topic.toLowerCase()));
    // 2. Check description keywords (simple heuristic)
    const hasAiDescription = repo.description && aiTopics.some(keyword => repo.description?.toLowerCase().includes(keyword));
    
    return !repo.isFork && (hasAiTopic || hasAiDescription);
  });

  // Claim 1: Open Source AI Contribution (Repo Ownership)
  // If they have an AI repo with decent traction
  const significantRepo = aiRepos.find(repo => repo.stars >= 5); // Low threshold for MVP
  
  if (significantRepo) {
    const evidenceData = {
      repoName: significantRepo.name,
      stars: significantRepo.stars,
      topics: significantRepo.topics,
    };

    // Create a deterministic hash of the evidence
    const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(evidenceData)).digest('hex');

    claims.push({
      id: uuidv4(),
      userId: userId,
      platform: 'GITHUB',
      category: 'AI_ENGINEERING',
      assertion: `Maintainer of AI repository '${significantRepo.name}' with ${significantRepo.stars} stars.`,
      evidence: {
        sourceUrl: significantRepo.url,
        snapshotHash: snapshotHash,
        dataSummary: evidenceData,
      },
      verificationStatus: {
        verified: true,
        timestamp: new Date().toISOString(),
        method: 'OAUTH_API_DIRECT_READ',
        confidenceScore: 1.0,
      }
    });
  }

  // Claim 2: AI Ecosystem Active Player
  // If they have multiple AI repos
  if (aiRepos.length >= 3) {
     const evidenceData = {
      repoCount: aiRepos.length,
      topLanguages: Array.from(new Set(aiRepos.map(r => r.language).filter(Boolean))),
    };
    const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(evidenceData)).digest('hex');

    claims.push({
      id: uuidv4(),
      userId: userId,
      platform: 'GITHUB',
      category: 'AI_ENGINEERING',
      assertion: `Active AI Engineer with ${aiRepos.length} public repositories focused on Machine Learning/AI.`,
      evidence: {
        sourceUrl: `https://github.com`, // General profile link in reality
        snapshotHash: snapshotHash,
        dataSummary: evidenceData,
      },
      verificationStatus: {
        verified: true,
        timestamp: new Date().toISOString(),
        method: 'OAUTH_API_DIRECT_READ',
        confidenceScore: 0.9,
      }
    });
  }

  return claims;
}
