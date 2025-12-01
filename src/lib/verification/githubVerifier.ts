import { GithubRepoSummary, VerifiedClaim, DeveloperDNA, VerificationResult } from './types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Calculates the "Developer DNA" profile based on repo data.
 */
function calculateDNA(repos: GithubRepoSummary[]): DeveloperDNA {
  // 1. Language Breakdown
  const languageCounts: Record<string, number> = {};
  let totalLanguageRepos = 0;

  repos.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalLanguageRepos++;
    }
  });

  const topLanguages = Object.entries(languageCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalLanguageRepos) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4); // Top 4

  // 2. Activity (Repo recency) - Proxy for "Consistency"
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const activeReposCount = repos.filter(r => new Date(r.updatedAt) > sixMonthsAgo).length;

  // 3. Total Stats
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);

  // 4. Archetype Determination
  let userType: DeveloperDNA['userType'] = 'Explorer';
  const forkCount = repos.filter(r => r.isFork).length;
  const originalCount = repos.length - forkCount;

  if (totalStars > 50) {
    userType = 'Architect';
  } else if (originalCount > 10) {
    userType = 'Builder';
  } else if (forkCount > originalCount && forkCount > 5) {
    userType = 'Researcher';
  }

  return {
    topLanguages,
    archetype: `The ${userType}`, // e.g. "The Builder"
    activeReposCount,
    totalStars,
    userType
  };
}

/**
 * Analyzes a list of GitHub repositories to find AI-relevant engineering work and generate a DNA profile.
 * @param repos List of repositories fetched from GitHub API
 * @param userId The internal user ID to associate the claim with
 */
export function analyzeGithubPortfolio(repos: GithubRepoSummary[], userId: string): VerificationResult {
  const claims: VerifiedClaim[] = [];
  
  // DNA Calculation
  const dna = calculateDNA(repos);

  // --- Verification Logic ---
  
  // Define AI-specific keywords
  const aiTopics = ['machine-learning', 'deep-learning', 'nlp', 'computer-vision', 'pytorch', 'tensorflow', 'llm', 'generative-ai', 'rag', 'transformers', 'huggingface', 'ai'];
  
  const aiRepos = repos.filter(repo => {
    // 1. Check topics
    const hasAiTopic = repo.topics.some(topic => aiTopics.includes(topic.toLowerCase()));
    // 2. Check description keywords (simple heuristic)
    const hasAiDescription = repo.description && aiTopics.some(keyword => repo.description?.toLowerCase().includes(keyword));
    // 3. Relaxed MVP Check: Just being Python isn't enough, but let's be generous if it's Python + "bot" or "data"
    
    return !repo.isFork && (hasAiTopic || hasAiDescription);
  });

  // Claim 1: Open Source AI Contribution (Repo Ownership)
  // MVP Threshold: >1 star (Very low barrier to entry to show "Success" state)
  const significantRepo = aiRepos.find(repo => repo.stars >= 1); 
  
  if (significantRepo) {
    const evidenceData = {
      repoName: significantRepo.name,
      stars: significantRepo.stars,
      topics: significantRepo.topics,
    };

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
  // MVP Threshold: >1 AI Repo
  if (aiRepos.length >= 1) {
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
        sourceUrl: `https://github.com`,
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

  return { claims, dna };
}