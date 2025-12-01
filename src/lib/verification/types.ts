export interface VerifiedClaim {
  id: string;
  userId: string;
  platform: 'GITHUB' | 'HUGGING_FACE' | 'KAGGLE';
  category: 'AI_ENGINEERING' | 'OPEN_SOURCE_CONTRIBUTION' | 'MODEL_TRAINING';
  assertion: string; // The human-readable claim, e.g., "Maintains repo 'fast-rag' with 500+ stars"
  evidence: {
    sourceUrl: string; // e.g., https://api.github.com/users/lightboy01/repos
    snapshotHash: string; // Cryptographic hash of the raw data at verification time
    dataSummary: Record<string, unknown>; // Minimal metadata to display (stars, forks, tags)
  };
  verificationStatus: {
    verified: boolean;
    timestamp: string; // ISO date
    method: 'OAUTH_API_DIRECT_READ';
    confidenceScore: number; // 0.0 to 1.0
  };
}

export interface GithubRepoSummary {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  isFork: boolean;
  url: string;
}
